import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Form } from './form.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { isMappableDataSourceType } from '../indicators/constants/data-source.js';
import { CreateFormDto } from './dto/create-form.dto.js';
import { UpdateFormDto } from './dto/update-form.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { AlertsService } from '../alerts/alerts.service.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepo: Repository<Form>,
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(Indicator)
    private readonly indicatorRepo: Repository<Indicator>,
    private readonly auditService: AuditService,
    private readonly alertsService: AlertsService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Phase 7: a form's `field_mappings` may only reference indicators whose
   * `data_source_type` is form-mappable (form_submission or manual). External-
   * source indicators (external_feed, tracer_study, contractor_report,
   * financial_statement, policy_document) get progress via manual entry or
   * API-token posts — never via form auto-population.
   *
   * Throws 422 UnprocessableEntityException with a structured code so the
   * frontend form builder can surface the offending mapping inline.
   */
  private async assertMappingsAllowed(
    field_mappings: Form['field_mappings'] | undefined,
  ): Promise<void> {
    if (!field_mappings?.length) return;
    const ids = Array.from(
      new Set(field_mappings.map((m) => m.indicator_id).filter(Boolean)),
    );
    if (!ids.length) return;

    const indicators = await this.indicatorRepo.find({
      where: { id: In(ids) },
      select: ['id', 'data_source_type'],
    });
    const offenders = indicators.filter(
      (i) => !isMappableDataSourceType(i.data_source_type),
    );
    if (offenders.length === 0) return;

    const first = offenders[0];
    throw new UnprocessableEntityException({
      message: `Indicator ${first.id} has data_source_type '${first.data_source_type}' and cannot be auto-populated from a form mapping.`,
      code: 'EXTERNAL_INDICATOR_NOT_MAPPABLE',
      indicator_id: first.id,
      data_source_type: first.data_source_type,
    });
  }

  async findAll(filters: { status?: string; assigned_to?: string }) {
    const qb = this.formRepo.createQueryBuilder('f');

    if (filters.status) {
      qb.andWhere('f.status = :status', { status: filters.status });
    }
    if (filters.assigned_to) {
      qb.andWhere(':userId = ANY(f.assigned_to)', {
        userId: filters.assigned_to,
      });
    }

    qb.orderBy('f.created_at', 'DESC');
    const forms = await qb.getMany();
    return forms.map((f) => this.serialize(f));
  }

  async findOne(id: string) {
    const form = await this.formRepo.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Form not found');
    return this.serialize(form);
  }

  async create(dto: CreateFormDto, actorId: string, actorName: string) {
    await this.assertMappingsAllowed(dto.field_mappings);
    const form = this.formRepo.create({
      title: dto.title,
      description: dto.description ?? '',
      fields: dto.fields ?? [],
      indicator_ids: dto.indicator_ids ?? [],
      assigned_to: dto.assigned_to ?? [],
      field_mappings: dto.field_mappings ?? [],
      location_ids: dto.location_ids ?? [],
      require_gps: dto.require_gps ?? false,
      created_by: dto.created_by,
      status: dto.status ?? 'draft',
    });
    const saved = await this.formRepo.save(form);
    const result = this.serialize(saved);

    await this.notifyNewAssignees(dto.assigned_to ?? [], saved.title);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'form',
      resource_id: saved.id,
      after_data: result,
    });

    return result;
  }

  async update(
    id: string,
    dto: UpdateFormDto,
    actorId: string,
    actorName: string,
  ) {
    const form = await this.formRepo.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Form not found');

    if (dto.field_mappings !== undefined) {
      await this.assertMappingsAllowed(dto.field_mappings);
    }

    const beforeData = this.serialize(form);

    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
    Object.assign(form, updates);
    const saved = await this.formRepo.save(form);
    const afterData = this.serialize(saved);

    const oldAssigned = beforeData.assigned_to ?? [];
    const newAssigned = dto.assigned_to;
    if (newAssigned !== undefined) {
      const newlyAddedIds = newAssigned.filter(
        (id) => !oldAssigned.includes(id),
      );
      await this.notifyNewAssignees(newlyAddedIds, saved.title);
    }

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'form',
      resource_id: saved.id,
      before_data: beforeData,
      after_data: afterData,
    });

    return afterData;
  }

  async remove(id: string, actorId: string, actorName: string) {
    const form = await this.formRepo.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Form not found');

    const submissionCount = await this.subRepo.count({
      where: { form_id: id },
    });
    if (submissionCount > 0) {
      throw new ConflictException(
        `Cannot delete form with ${submissionCount} existing submission(s). Remove or reassign submissions first.`,
      );
    }

    const beforeData = this.serialize(form);

    await this.formRepo.remove(form);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'delete',
      resource: 'form',
      resource_id: id,
      before_data: beforeData,
    });
  }

  private async notifyNewAssignees(
    userIds: string[],
    formTitle: string,
  ): Promise<void> {
    for (const userId of userIds) {
      const user = await this.usersService.findById(userId);
      if (!user) continue;

      void this.alertsService.create({
        user_id: user.id,
        user_email: user.email,
        title: 'Form Assigned',
        description: `You have been assigned the form "${formTitle}". Open Data Entry to submit.`,
        type: 'form_assigned',
        sendEmail: false,
      });

      void this.mailService.sendFormAssigned(user.email, user.name, formTitle);
    }
  }

  private serialize(f: Form) {
    return {
      id: f.id,
      title: f.title,
      description: f.description,
      fields: f.fields,
      indicator_ids: f.indicator_ids,
      assigned_to: f.assigned_to,
      field_mappings: f.field_mappings ?? [],
      location_ids: f.location_ids ?? [],
      require_gps: f.require_gps ?? false,
      created_by: f.created_by,
      status: f.status,
      createdAt: f.created_at,
    };
  }
}
