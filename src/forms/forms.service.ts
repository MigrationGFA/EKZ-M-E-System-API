import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form } from './form.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { CreateFormDto } from './dto/create-form.dto.js';
import { UpdateFormDto } from './dto/update-form.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepo: Repository<Form>,
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    private readonly auditService: AuditService,
  ) {}

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

    const beforeData = this.serialize(form);

    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
    Object.assign(form, updates);
    const saved = await this.formRepo.save(form);
    const afterData = this.serialize(saved);

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
