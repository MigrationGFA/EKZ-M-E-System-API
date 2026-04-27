import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Submission } from './submission.entity.js';
import { ProjectLocation } from '../locations/project-location.entity.js';
import { Form } from '../forms/form.entity.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';
import { applyGeofence } from './helpers/geofence.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AlertsService } from '../alerts/alerts.service.js';
import { IndicatorsService } from '../indicators/indicators.service.js';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(ProjectLocation)
    private readonly locRepo: Repository<ProjectLocation>,
    @InjectRepository(Form)
    private readonly formRepo: Repository<Form>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly alertsService: AlertsService,
    private readonly indicatorsService: IndicatorsService,
  ) {}

  async findAll(filters: {
    form_id?: string;
    officer_id?: string;
    validation_status?: string;
    page?: number;
    per_page?: number;
  }) {
    const qb = this.subRepo.createQueryBuilder('s');

    if (filters.form_id) {
      qb.andWhere('s.form_id = :formId', { formId: filters.form_id });
    }
    if (filters.officer_id) {
      qb.andWhere('s.officer_id = :officerId', {
        officerId: filters.officer_id,
      });
    }
    if (filters.validation_status) {
      qb.andWhere('s.validation_status = :vs', {
        vs: filters.validation_status,
      });
    }

    const total = await qb.getCount();

    if (filters.page && filters.per_page) {
      qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
    }

    qb.orderBy('s.submitted_at', 'DESC');
    const subs = await qb.getMany();

    return {
      data: subs.map((s) => this.serialize(s)),
      total,
      page: filters.page ?? 1,
      per_page: filters.per_page ?? total,
    };
  }

  async findOne(id: string) {
    const sub = await this.subRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Submission not found');
    return this.serialize(sub);
  }

  async create(dto: CreateSubmissionDto, actorId: string, actorName: string) {
    // FK validation — give a clean 422 rather than a cryptic DB constraint error
    const formExists = await this.formRepo.existsBy({ id: dto.formId });
    if (!formExists) {
      throw new UnprocessableEntityException(
        `Form ${dto.formId} does not exist`,
      );
    }

    const existing = await this.subRepo.findOne({ where: { id: dto.id } });
    if (existing) {
      throw new ConflictException(
        `Submission with id ${dto.id} already exists`,
      );
    }

    // Compute geofence before the first save to avoid a second round-trip
    const locations = await this.locRepo.find();
    const geo = applyGeofence(dto.location ?? null, locations);

    const sub = this.subRepo.create({
      id: dto.id,
      form_id: dto.formId,
      officer_id: dto.officerId,
      data: dto.data,
      location: dto.location ?? null,
      submitted_at: new Date(dto.submittedAt),
      location_id: geo.location_id,
      on_site: geo.on_site,
    });

    const saved = await this.subRepo.save(sub);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'submit',
      resource: 'submission',
      resource_id: saved.id,
      after_data: {
        formId: dto.formId,
        officerId: dto.officerId,
        on_site: geo.on_site,
      },
    });

    // Off-site alert
    if (geo.on_site === false) {
      void this.notifyOffSite(saved.id, dto.officerId);
    }

    // Sync success alert for the officer
    const officer = await this.usersService.findById(dto.officerId);
    if (officer) {
      void this.alertsService.create({
        user_id: officer.id,
        user_email: officer.email,
        title: 'Submission Synced',
        description: `Your submission for form ${dto.formId} was received and recorded successfully.`,
        type: 'sync_success',
      });
    }

    return { id: saved.id, status: 'accepted' };
  }

  async createBatch(
    dtos: CreateSubmissionDto[],
    actorId: string,
    actorName: string,
  ) {
    const accepted: string[] = [];
    const rejected: { id: string; reason: string }[] = [];

    // Fetch all locations once — shared across every submission in the batch
    const locations = await this.locRepo.find();

    // Fetch admin/me_staff recipients once for potential off-site alerts
    const adminRecipients = await this.usersService.findAdminAndMeStaff();
    const adminEmails = adminRecipients.map((u) => u.email);

    // Bulk duplicate check — one query instead of N individual findOne calls
    const incomingIds = dtos.map((d) => d.id);
    const existingRows = await this.subRepo.find({
      where: { id: In(incomingIds) },
      select: ['id'],
    });
    const existingIds = new Set(existingRows.map((r) => r.id));

    // Validate all formIds in a single query
    const uniqueFormIds = [...new Set(dtos.map((d) => d.formId))];
    const validForms = await this.formRepo.find({
      where: { id: In(uniqueFormIds) },
      select: ['id'],
    });
    const validFormIds = new Set(validForms.map((f) => f.id));

    for (const dto of dtos) {
      try {
        // Idempotent — silently accept already-persisted submissions
        if (existingIds.has(dto.id)) {
          accepted.push(dto.id);
          continue;
        }

        if (!validFormIds.has(dto.formId)) {
          rejected.push({
            id: dto.id,
            reason: `Form ${dto.formId} does not exist`,
          });
          continue;
        }

        // Compute geofence before save — single save per submission
        const geo = applyGeofence(dto.location ?? null, locations);

        const sub = this.subRepo.create({
          id: dto.id,
          form_id: dto.formId,
          officer_id: dto.officerId,
          data: dto.data,
          location: dto.location ?? null,
          submitted_at: new Date(dto.submittedAt),
          location_id: geo.location_id,
          on_site: geo.on_site,
        });

        await this.subRepo.save(sub);
        accepted.push(dto.id);

        void this.auditService.log({
          user_id: actorId,
          user_name: actorName,
          action: 'submit',
          resource: 'submission',
          resource_id: dto.id,
          after_data: {
            formId: dto.formId,
            officerId: dto.officerId,
            on_site: geo.on_site,
          },
        });

        // Off-site alert for newly saved submissions
        if (geo.on_site === false && adminEmails.length > 0) {
          const officer = await this.usersService.findById(dto.officerId);
          void this.mailService.sendOffSiteAlert(
            adminEmails,
            dto.id,
            officer?.name ?? dto.officerId,
          );

          // In-app alerts for admins/me_staff
          for (const admin of adminRecipients) {
            void this.alertsService.create({
              user_id: admin.id,
              user_email: admin.email,
              title: 'Off-Site Submission Detected',
              description: `Submission ${dto.id} was recorded outside all project geofences. Officer: ${officer?.name ?? dto.officerId}.`,
              type: 'data_flag',
            });
          }
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        rejected.push({ id: dto.id, reason: message });
      }
    }

    // Send one sync_success alert per unique officer in the accepted list
    const acceptedDtos = dtos.filter(
      (d) => accepted.includes(d.id) && !existingIds.has(d.id),
    );
    const uniqueOfficerIds = [...new Set(acceptedDtos.map((d) => d.officerId))];
    for (const officerId of uniqueOfficerIds) {
      const off = await this.usersService.findById(officerId);
      if (off) {
        void this.alertsService.create({
          user_id: off.id,
          user_email: off.email,
          title: 'Submissions Synced',
          description: `Your submissions were received and recorded successfully.`,
          type: 'sync_success',
        });
      }
    }

    return { accepted, rejected };
  }

  async validate(
    id: string,
    action: string,
    comment: string | undefined,
    actorId: string,
    actorName: string,
  ) {
    const sub = await this.subRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Submission not found');

    const beforeStatus = sub.validation_status;

    // Both approved and rejected are terminal states — no further action allowed
    if (sub.validation_status === 'approved') {
      throw new BadRequestException(
        'Submission is already approved and cannot be re-validated',
      );
    }
    if (sub.validation_status === 'rejected') {
      throw new BadRequestException(
        'Submission is already rejected and cannot be re-validated',
      );
    }

    sub.validation_status = action === 'approve' ? 'approved' : 'rejected';
    sub.validation_comment = comment ?? null;
    const saved = await this.subRepo.save(sub);

    if (action === 'approve') {
      await this.applyFieldMappings(saved, actorId, actorName);
    }

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'submission',
      resource_id: id,
      before_data: { validation_status: beforeStatus },
      after_data: {
        validation_status: saved.validation_status,
        validation_comment: saved.validation_comment,
      },
    });

    // Fetch form title for email — one query, used in both branches
    const form = await this.formRepo.findOne({
      where: { id: sub.form_id },
      select: ['title'],
    });
    const formTitle = form?.title ?? sub.form_id;
    const validatedAt = new Date();

    // Notify the officer — email + in-app alert
    const officer = await this.usersService.findById(sub.officer_id);
    if (officer) {
      if (action === 'approve') {
        void this.mailService.sendSubmissionApproved(
          officer.email,
          officer.name,
          id,
          formTitle,
          actorName,
          validatedAt,
        );
        void this.alertsService.create({
          user_id: officer.id,
          user_email: officer.email,
          title: 'Submission Approved',
          description: `Your submission for "${formTitle}" was approved by ${actorName}. The data has been recorded in the M&E system.`,
          type: 'submission_approved',
        });
      } else {
        void this.mailService.sendSubmissionRejected(
          officer.email,
          officer.name,
          id,
          formTitle,
          comment ?? '',
          actorName,
          validatedAt,
        );
        void this.alertsService.create({
          user_id: officer.id,
          user_email: officer.email,
          title: 'Submission Rejected',
          description: `Your submission for "${formTitle}" was rejected by ${actorName}. Reason: ${comment ?? ''}`,
          type: 'submission_rejected',
        });
      }
    }

    return this.serialize(saved);
  }

  private async applyFieldMappings(
    sub: Submission,
    actorId: string,
    actorName: string,
  ): Promise<void> {
    const form = await this.formRepo.findOne({ where: { id: sub.form_id } });
    if (!form?.field_mappings?.length) return;

    const submittedDate = sub.submitted_at.toISOString().split('T')[0];

    for (const mapping of form.field_mappings) {
      const rawValue = sub.data[mapping.form_field_id];
      if (rawValue === undefined || rawValue === null || rawValue === '') continue;

      const numValue =
        typeof rawValue === 'number' ? rawValue : Number(rawValue);
      if (Number.isNaN(numValue)) continue;

      try {
        await this.indicatorsService.addProgress(
          mapping.indicator_id,
          {
            value: numValue,
            date: submittedDate,
            submittedBy: actorName,
            notes: `Auto-linked from submission ${sub.id}`,
          },
          actorId,
          actorName,
        );
      } catch (err) {
        this.logger.warn(
          `Failed to auto-link progress for indicator ${mapping.indicator_id}: ${(err as Error).message}`,
        );
      }
    }
  }

  private async notifyOffSite(
    submissionId: string,
    officerId: string,
  ): Promise<void> {
    const admins = await this.usersService.findAdminAndMeStaff();
    if (admins.length === 0) return;

    const officer = await this.usersService.findById(officerId);
    const officerName = officer?.name ?? officerId;

    void this.mailService.sendOffSiteAlert(
      admins.map((u) => u.email),
      submissionId,
      officerName,
    );

    // Create in-app alert for each admin/me_staff
    for (const admin of admins) {
      void this.alertsService.create({
        user_id: admin.id,
        user_email: admin.email,
        title: 'Off-Site Submission Detected',
        description: `Submission ${submissionId} was recorded outside all project geofences. Officer: ${officerName}.`,
        type: 'data_flag',
      });
    }
  }

  private serialize(s: Submission) {
    return {
      id: s.id,
      formId: s.form_id,
      officerId: s.officer_id,
      data: s.data,
      location: s.location,
      location_id: s.location_id,
      on_site: s.on_site,
      submittedAt: s.submitted_at,
      validation_status: s.validation_status,
      validation_comment: s.validation_comment,
    };
  }
}
