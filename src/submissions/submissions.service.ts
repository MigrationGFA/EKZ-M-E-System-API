import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from './submission.entity.js';
import { ProjectLocation } from '../locations/project-location.entity.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';
import { applyGeofence } from './helpers/geofence.js';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(ProjectLocation)
    private readonly locRepo: Repository<ProjectLocation>,
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
    if (filters.page && filters.per_page) {
      qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
    }

    qb.orderBy('s.submitted_at', 'DESC');
    const subs = await qb.getMany();
    return subs.map((s) => this.serialize(s));
  }

  async create(dto: CreateSubmissionDto) {
    const existing = await this.subRepo.findOne({ where: { id: dto.id } });
    if (existing) {
      throw new ConflictException(
        `Submission with id ${dto.id} already exists`,
      );
    }

    const sub = this.subRepo.create({
      id: dto.id,
      form_id: dto.formId,
      officer_id: dto.officerId,
      data: dto.data,
      location: dto.location ?? null,
      submitted_at: new Date(dto.submittedAt),
    });

    const saved = await this.subRepo.save(sub);

    // Geofencing
    const locations = await this.locRepo.find();
    const geo = applyGeofence(saved.location, locations);
    saved.location_id = geo.location_id;
    saved.on_site = geo.on_site;
    await this.subRepo.save(saved);

    return { id: saved.id, status: 'accepted' };
  }

  async createBatch(dtos: CreateSubmissionDto[]) {
    const accepted: string[] = [];
    const rejected: { id: string; reason: string }[] = [];
    const locations = await this.locRepo.find();

    for (const dto of dtos) {
      try {
        const existing = await this.subRepo.findOne({
          where: { id: dto.id },
        });
        if (existing) {
          // Idempotent — silently accept duplicates
          accepted.push(dto.id);
          continue;
        }

        const sub = this.subRepo.create({
          id: dto.id,
          form_id: dto.formId,
          officer_id: dto.officerId,
          data: dto.data,
          location: dto.location ?? null,
          submitted_at: new Date(dto.submittedAt),
        });

        const saved = await this.subRepo.save(sub);

        const geo = applyGeofence(saved.location, locations);
        saved.location_id = geo.location_id;
        saved.on_site = geo.on_site;
        await this.subRepo.save(saved);

        accepted.push(dto.id);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        rejected.push({ id: dto.id, reason: message });
      }
    }

    return { accepted, rejected };
  }

  async validate(id: string, action: string, comment?: string) {
    const sub = await this.subRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Submission not found');

    sub.validation_status = action === 'approve' ? 'approved' : 'rejected';
    sub.validation_comment = comment ?? null;
    const saved = await this.subRepo.save(sub);
    return this.serialize(saved);
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
