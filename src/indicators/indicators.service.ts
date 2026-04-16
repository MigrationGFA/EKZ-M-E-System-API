import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indicator } from './indicator.entity.js';
import { IndicatorProgress } from './indicator-progress.entity.js';
import { Form } from '../forms/form.entity.js';
import { CreateIndicatorDto } from './dto/create-indicator.dto.js';
import { UpdateIndicatorDto } from './dto/update-indicator.dto.js';
import { CreateProgressDto } from './dto/create-progress.dto.js';
import { computeStatus } from './helpers/compute-status.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AlertsService } from '../alerts/alerts.service.js';

@Injectable()
export class IndicatorsService {
  constructor(
    @InjectRepository(Indicator)
    private readonly indicatorRepo: Repository<Indicator>,
    @InjectRepository(IndicatorProgress)
    private readonly progressRepo: Repository<IndicatorProgress>,
    @InjectRepository(Form)
    private readonly formRepo: Repository<Form>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly alertsService: AlertsService,
  ) {}

  async findAll(filters: {
    status?: string;
    logframe_level_id?: string;
    sdg_id?: number;
    frequency?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) {
    const qb = this.indicatorRepo.createQueryBuilder('i');

    if (filters.status) {
      qb.andWhere('i.status = :status', { status: filters.status });
    }
    if (filters.logframe_level_id) {
      qb.andWhere('i.logframe_level_id = :lfId', {
        lfId: filters.logframe_level_id,
      });
    }
    if (filters.sdg_id) {
      qb.andWhere(':sdgId = ANY(i.sdg_ids)', { sdgId: filters.sdg_id });
    }
    if (filters.frequency) {
      qb.andWhere('i.frequency = :frequency', {
        frequency: filters.frequency,
      });
    }
    if (filters.search) {
      qb.andWhere('(i.name ILIKE :search OR i.code ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const total = await qb.getCount();

    if (filters.page && filters.per_page) {
      qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
    }

    qb.orderBy('i.created_at', 'DESC');

    const indicators = await qb.getMany();

    return {
      data: indicators.map((i) => this.serialize(i)),
      total,
      page: filters.page ?? 1,
      per_page: filters.per_page ?? total,
    };
  }

  async findOne(id: string) {
    const indicator = await this.indicatorRepo.findOne({ where: { id } });
    if (!indicator) throw new NotFoundException('Indicator not found');
    return this.serialize(indicator);
  }

  async create(dto: CreateIndicatorDto, actorId: string, actorName: string) {
    const baseline = dto.baseline ?? 0;
    const status = computeStatus(baseline, dto.target);

    const indicator = this.indicatorRepo.create({
      ...dto,
      baseline,
      current_value: baseline,
      status,
      sdg_ids: dto.sdg_ids ?? [],
      logframe_level_id: dto.logframe_level_id ?? null,
    });

    const saved = await this.indicatorRepo.save(indicator);
    const result = this.serialize(saved);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'indicator',
      resource_id: saved.id,
      after_data: result,
    });

    return result;
  }

  async update(id: string, dto: UpdateIndicatorDto, actorId: string, actorName: string) {
    const indicator = await this.indicatorRepo.findOne({ where: { id } });
    if (!indicator) throw new NotFoundException('Indicator not found');

    const beforeData = this.serialize(indicator);
    const oldStatus = indicator.status;

    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
    Object.assign(indicator, updates);

    // Recompute status if current_value or target changed
    if (dto.current_value !== undefined || dto.target !== undefined) {
      indicator.status = computeStatus(
        Number(indicator.current_value),
        Number(indicator.target),
      );
    }

    const saved = await this.indicatorRepo.save(indicator);

    this.notifyStatusChangeIfNeeded(
      oldStatus,
      saved.status,
      saved.name,
      saved.code,
    );

    const afterData = this.serialize(saved);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'indicator',
      resource_id: saved.id,
      before_data: beforeData,
      after_data: afterData,
    });

    return afterData;
  }

  async remove(id: string, actorId: string, actorName: string) {
    const indicator = await this.indicatorRepo.findOne({ where: { id } });
    if (!indicator) throw new NotFoundException('Indicator not found');

    const beforeData = this.serialize(indicator);

    // Check for linked submissions (will be checked once submissions table exists)
    // For now, just check if the table exists and has references
    try {
      const submissions = await this.indicatorRepo.manager.query(
        `SELECT COUNT(*) as count FROM submissions s
         JOIN forms f ON s.form_id = f.id
         WHERE $1 = ANY(f.indicator_ids)`,
        [id],
      );
      if (submissions[0]?.count > 0) {
        throw new ConflictException(
          'Cannot delete indicator with linked submissions',
        );
      }
    } catch (e) {
      // If submissions table doesn't exist yet, allow deletion
      if (e instanceof ConflictException) throw e;
    }

    await this.indicatorRepo.remove(indicator);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'delete',
      resource: 'indicator',
      resource_id: id,
      before_data: beforeData,
    });
  }

  async getProgress(id: string, from?: string, to?: string) {
    const indicator = await this.indicatorRepo.findOne({ where: { id } });
    if (!indicator) throw new NotFoundException('Indicator not found');

    const qb = this.progressRepo
      .createQueryBuilder('p')
      .where('p.indicator_id = :id', { id })
      .orderBy('p.date', 'ASC');

    if (from) {
      qb.andWhere('p.date >= :from', { from });
    }
    if (to) {
      qb.andWhere('p.date <= :to', { to });
    }

    const entries = await qb.getMany();
    return entries.map((e) => ({
      id: e.id,
      indicatorId: e.indicator_id,
      value: Number(e.value),
      date: e.date,
      notes: e.notes,
      submittedBy: e.submitted_by,
    }));
  }

  async getLinkedForms(indicatorId: string) {
    const indicator = await this.indicatorRepo.findOne({
      where: { id: indicatorId },
    });
    if (!indicator) throw new NotFoundException('Indicator not found');

    const forms = await this.formRepo
      .createQueryBuilder('f')
      .where(':indicatorId = ANY(f.indicator_ids)', { indicatorId })
      .orderBy('f.created_at', 'DESC')
      .getMany();

    return forms.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      fields: f.fields,
      indicator_ids: f.indicator_ids,
      assigned_to: f.assigned_to,
      created_by: f.created_by,
      status: f.status,
      createdAt: f.created_at,
    }));
  }

  async addProgress(indicatorId: string, dto: CreateProgressDto, actorId: string, actorName: string) {
    const indicator = await this.indicatorRepo.findOne({
      where: { id: indicatorId },
    });
    if (!indicator) throw new NotFoundException('Indicator not found');

    const oldStatus = indicator.status;

    const progress = this.progressRepo.create({
      indicator_id: indicatorId,
      value: dto.value,
      date: new Date(dto.date),
      notes: dto.notes ?? null,
      submitted_by: dto.submittedBy,
    });
    const savedProgress = await this.progressRepo.save(progress);

    // Only update current_value if this entry is the most recent by date
    const latestEntry = await this.progressRepo.findOne({
      where: { indicator_id: indicatorId },
      order: { date: 'DESC' },
    });

    if (latestEntry && latestEntry.id === savedProgress.id) {
      indicator.current_value = dto.value;
      indicator.status = computeStatus(
        Number(dto.value),
        Number(indicator.target),
      );
      await this.indicatorRepo.save(indicator);

      this.notifyStatusChangeIfNeeded(
        oldStatus,
        indicator.status,
        indicator.name,
        indicator.code,
      );
    }

    const progressResult = {
      id: savedProgress.id,
      indicatorId: indicator.id,
      value: Number(savedProgress.value),
      date: savedProgress.date,
      notes: savedProgress.notes,
      submittedBy: savedProgress.submitted_by,
    };

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'indicator_progress',
      resource_id: savedProgress.id,
      after_data: progressResult,
    });

    return progressResult;
  }

  private notifyStatusChangeIfNeeded(
    oldStatus: string,
    newStatus: string,
    name: string,
    code: string,
  ): void {
    if (newStatus === oldStatus) return;
    if (!['at_risk', 'off_track'].includes(newStatus)) return;

    void this.usersService.findAdminAndMeStaff().then((admins) => {
      const emails = admins.map((u) => u.email);
      if (emails.length === 0) return;

      void this.mailService.sendIndicatorStatusAlert(
        emails,
        name,
        code,
        newStatus,
      );

      const title = `Indicator ${newStatus === 'off_track' ? 'Off Track' : 'At Risk'}: ${code}`;
      const description = `"${name}" has moved to ${newStatus}. Review and take corrective action.`;

      for (const admin of admins) {
        void this.alertsService.create({
          user_id: admin.id,
          user_email: admin.email,
          title,
          description,
          type: 'missed_target',
        });
      }
    });
  }

  private serialize(ind: Indicator) {
    return {
      id: ind.id,
      code: ind.code,
      name: ind.name,
      description: ind.description,
      level: ind.level,
      unit: ind.unit,
      baseline: Number(ind.baseline),
      target: Number(ind.target),
      current_value: Number(ind.current_value),
      status: ind.status,
      frequency: ind.frequency,
      logframe_level_id: ind.logframe_level_id,
      sdg_ids: ind.sdg_ids,
      responsible_party: ind.responsible_party,
      means_of_verification: ind.means_of_verification,
      createdAt: ind.created_at,
      updatedAt: ind.updated_at,
    };
  }
}
