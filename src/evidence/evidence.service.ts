import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { EvidenceDocument } from './evidence-document.entity.js';
import type { DocumentType } from './evidence-document.entity.js';
import { CreateEvidenceDto } from './dto/create-evidence.dto.js';
import { UpdateEvidenceDto } from './dto/update-evidence.dto.js';
import { QueryEvidenceDto } from './dto/query-evidence.dto.js';
import {
  DOCUMENT_TYPE_CONFIG,
  computeRetentionUntil,
  isMimeAllowed,
} from './constants/document-types.js';
import {
  assertReadAccess,
  assertWriteAccess,
  canRead,
  type ActorContext,
} from './helpers/assert-read-access.js';
import { validateTypeMetadata } from './helpers/validate-type-metadata.js';
import { AuditService } from '../audit/audit.service.js';
import { Cohort } from '../beneficiaries/cohort.entity.js';
import { UserRole } from '../common/enums/user-role.enum.js';

export interface SerializedEvidenceDocument {
  id: string;
  title: string;
  description: string | null;
  document_type: DocumentType;
  type_metadata: Record<string, unknown>;
  reference_period_from: string | null;
  reference_period_to: string | null;
  retention_until: string | null;
  file_url: string;
  file_size_bytes: number;
  mime_type: string;
  sha256: string;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
  deleted_at: string | null;
  supersedes_id: string | null;
  indicator_id: string | null;
  indicator_progress_id: string | null;
  location_id: string | null;
}

export interface UploadedFileDescriptor {
  file_url: string;
  file_size_bytes: number;
  mime_type: string;
  sha256: string;
}

interface ReplaceOptions {
  force?: boolean;
  title?: string;
  description?: string;
  type_metadata?: Record<string, unknown>;
}

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    @InjectRepository(EvidenceDocument)
    private readonly repo: Repository<EvidenceDocument>,
    @InjectRepository(Cohort)
    private readonly cohortRepo: Repository<Cohort>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    query: QueryEvidenceDto,
    actor: ActorContext,
  ): Promise<{
    data: SerializedEvidenceDocument[];
    total: number;
    page: number;
    per_page: number;
  }> {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 25;

    const qb = this.repo.createQueryBuilder('d');

    const includeDeleted =
      query.include_deleted === 'true' && actor.role === UserRole.ADMIN;
    if (!includeDeleted) {
      qb.andWhere('d.deleted_at IS NULL');
    }

    if (query.document_type) {
      qb.andWhere('d.document_type = :type', { type: query.document_type });
    }
    if (query.indicator_id) {
      qb.andWhere('d.indicator_id = :iid', { iid: query.indicator_id });
    }
    if (query.indicator_progress_id) {
      qb.andWhere('d.indicator_progress_id = :pid', {
        pid: query.indicator_progress_id,
      });
    }
    if (query.location_id) {
      qb.andWhere('d.location_id = :lid', { lid: query.location_id });
    }
    if (query.orphan === 'true') {
      qb.andWhere(
        new Brackets((b) =>
          b
            .where('d.indicator_id IS NULL')
            .andWhere('d.indicator_progress_id IS NULL')
            .andWhere('d.location_id IS NULL'),
        ),
      );
    }
    if (query.due_for_deletion === 'true') {
      qb.andWhere('d.retention_until IS NOT NULL').andWhere(
        'd.retention_until < NOW()',
      );
    }
    if (query.q) {
      qb.andWhere('d.title ILIKE :q', { q: `%${query.q}%` });
    }

    const total = await qb.getCount();
    qb.orderBy('d.uploaded_at', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const rows = await qb.getMany();
    const visible = rows.filter((d) => canRead(d, actor));

    return {
      data: visible.map((d) => this.serialize(d)),
      total,
      page,
      per_page: perPage,
    };
  }

  async findOne(
    id: string,
    actor: ActorContext,
  ): Promise<SerializedEvidenceDocument> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Evidence document ${id} not found`);
    }
    assertReadAccess(entity, actor);
    return this.serialize(entity);
  }

  async create(
    dto: CreateEvidenceDto,
    actor: ActorContext,
    actorEmail: string,
  ): Promise<SerializedEvidenceDocument> {
    assertWriteAccess(dto.document_type, actor);
    this.assertSingleAttachment(dto);
    await this.validatePayload(dto);

    const entity = this.repo.create({
      title: dto.title,
      description: dto.description ?? null,
      document_type: dto.document_type,
      type_metadata: dto.type_metadata ?? {},
      reference_period_from: dto.reference_period_from ?? null,
      reference_period_to: dto.reference_period_to ?? null,
      retention_until:
        dto.retention_until !== undefined
          ? new Date(dto.retention_until)
          : computeRetentionUntil(dto.document_type),
      file_url: dto.file_url,
      file_size_bytes: dto.file_size_bytes,
      mime_type: dto.mime_type,
      sha256: dto.sha256,
      uploaded_by: actor.id,
      indicator_id: dto.indicator_id ?? null,
      indicator_progress_id: dto.indicator_progress_id ?? null,
      location_id: dto.location_id ?? null,
    });
    const saved = await this.repo.save(entity);

    await this.auditService.log({
      user_id: actor.id,
      user_name: actorEmail,
      action: 'upload',
      resource: 'evidence_document',
      resource_id: saved.id,
      after_data: {
        title: saved.title,
        document_type: saved.document_type,
        file_size_bytes: saved.file_size_bytes,
        sha256: saved.sha256,
        attached_to: this.describeAttachment(saved),
      },
    });

    return this.serialize(saved);
  }

  async update(
    id: string,
    dto: UpdateEvidenceDto,
    actor: ActorContext,
    actorEmail: string,
  ): Promise<SerializedEvidenceDocument> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Evidence document ${id} not found`);
    }
    assertWriteAccess(entity.document_type, actor);

    const before = {
      title: entity.title,
      description: entity.description,
      type_metadata: entity.type_metadata,
      reference_period_from: entity.reference_period_from,
      reference_period_to: entity.reference_period_to,
      retention_until: entity.retention_until,
    };

    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.type_metadata !== undefined)
      entity.type_metadata = dto.type_metadata;
    if (dto.reference_period_from !== undefined)
      entity.reference_period_from = dto.reference_period_from;
    if (dto.reference_period_to !== undefined)
      entity.reference_period_to = dto.reference_period_to;
    if (dto.retention_until !== undefined)
      entity.retention_until = new Date(dto.retention_until);

    await this.validateMetadataOnEntity(entity);

    const saved = await this.repo.save(entity);

    await this.auditService.log({
      user_id: actor.id,
      user_name: actorEmail,
      action: 'update',
      resource: 'evidence_document',
      resource_id: saved.id,
      before_data: before,
      after_data: {
        title: saved.title,
        description: saved.description,
        type_metadata: saved.type_metadata,
        reference_period_from: saved.reference_period_from,
        reference_period_to: saved.reference_period_to,
        retention_until: saved.retention_until,
      },
    });

    return this.serialize(saved);
  }

  /**
   * Replace the underlying file with a freshly uploaded blob. Returns the NEW
   * row (with `supersedes_id` set to the old one). Per ADR 0005 §101:
   *
   *  - If the new SHA matches the existing row's SHA, the upload is a no-op
   *    (idempotent retry) — the existing row is returned unchanged.
   *  - If the SHA differs and `force` is not set, we return 409 with both
   *    SHAs so the UI can prompt the user.
   *  - If `force=true`, a new row is inserted with `supersedes_id` pointing
   *    at the old, the old row is soft-deleted, and audit logs the chain.
   */
  async replace(
    id: string,
    uploaded: UploadedFileDescriptor,
    actor: ActorContext,
    actorEmail: string,
    options: ReplaceOptions = {},
  ): Promise<SerializedEvidenceDocument> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Evidence document ${id} not found`);
    }
    assertWriteAccess(existing.document_type, actor);

    if (uploaded.sha256 === existing.sha256) {
      // Same bytes — treat as idempotent retry.
      return this.serialize(existing);
    }

    if (options.force !== true) {
      throw new ConflictException({
        message:
          'Checksum mismatch — confirm replace by retrying with force=true',
        code: 'CHECKSUM_MISMATCH',
        existing_sha256: existing.sha256,
        new_sha256: uploaded.sha256,
      });
    }

    if (!isMimeAllowed(existing.document_type, uploaded.mime_type)) {
      throw new BadRequestException(
        `MIME ${uploaded.mime_type} not permitted for ${existing.document_type}`,
      );
    }

    const newEntity = this.repo.create({
      title: options.title ?? existing.title,
      description: options.description ?? existing.description,
      document_type: existing.document_type,
      type_metadata: options.type_metadata ?? existing.type_metadata,
      reference_period_from: existing.reference_period_from,
      reference_period_to: existing.reference_period_to,
      retention_until:
        existing.retention_until ??
        computeRetentionUntil(existing.document_type),
      file_url: uploaded.file_url,
      file_size_bytes: String(uploaded.file_size_bytes),
      mime_type: uploaded.mime_type,
      sha256: uploaded.sha256,
      uploaded_by: actor.id,
      supersedes_id: existing.id,
      indicator_id: existing.indicator_id,
      indicator_progress_id: existing.indicator_progress_id,
      location_id: existing.location_id,
    });
    const savedNew = await this.repo.save(newEntity);

    // Soft-delete the superseded row so listings show only the live version.
    existing.deleted_at = new Date();
    await this.repo.save(existing);

    await this.auditService.log({
      user_id: actor.id,
      user_name: actorEmail,
      action: 'replace',
      resource: 'evidence_document',
      resource_id: savedNew.id,
      before_data: { sha256: existing.sha256, supersedes_id: existing.id },
      after_data: {
        sha256: savedNew.sha256,
        file_size_bytes: savedNew.file_size_bytes,
        supersedes_id: existing.id,
      },
    });

    return this.serialize(savedNew);
  }

  async softDelete(
    id: string,
    actor: ActorContext,
    actorEmail: string,
  ): Promise<{ id: string; deleted_at: string }> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Evidence document ${id} not found`);
    }
    assertWriteAccess(entity.document_type, actor);

    if (entity.deleted_at) {
      return { id: entity.id, deleted_at: entity.deleted_at.toISOString() };
    }

    entity.deleted_at = new Date();
    const saved = await this.repo.save(entity);

    await this.auditService.log({
      user_id: actor.id,
      user_name: actorEmail,
      action: 'delete',
      resource: 'evidence_document',
      resource_id: saved.id,
      before_data: {
        title: entity.title,
        document_type: entity.document_type,
      },
    });

    return {
      id: saved.id,
      deleted_at: (saved.deleted_at ?? new Date()).toISOString(),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private assertSingleAttachment(dto: CreateEvidenceDto): void {
    const set = [
      dto.indicator_id,
      dto.indicator_progress_id,
      dto.location_id,
    ].filter((v) => v !== undefined && v !== null && v !== '').length;
    if (set > 1) {
      throw new BadRequestException(
        'At most one of indicator_id / indicator_progress_id / location_id may be set',
      );
    }
  }

  private async validatePayload(dto: CreateEvidenceDto): Promise<void> {
    const config = DOCUMENT_TYPE_CONFIG[dto.document_type];

    if (!isMimeAllowed(dto.document_type, dto.mime_type)) {
      throw new BadRequestException(
        `MIME ${dto.mime_type} not permitted for ${dto.document_type}`,
      );
    }

    const sizeBytes = Number(dto.file_size_bytes);
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      throw new BadRequestException(
        'file_size_bytes must be a positive number',
      );
    }
    if (sizeBytes > config.maxSizeBytes) {
      throw new BadRequestException(
        `File exceeds the ${Math.round(config.maxSizeBytes / 1024 / 1024)} MB limit for ${dto.document_type}`,
      );
    }

    validateTypeMetadata(dto.document_type, dto.type_metadata, {
      from: dto.reference_period_from,
      to: dto.reference_period_to,
    });

    // Tracer studies carry a soft-reference to a cohort code per adj. call #12.
    if (dto.document_type === 'beneficiary_tracer_study') {
      const code = (dto.type_metadata?.cohort_code ?? null) as string | null;
      if (code) {
        const cohort = await this.cohortRepo.findOne({ where: { code } });
        if (!cohort) {
          throw new BadRequestException(`Unknown cohort code: ${code}`);
        }
      }
    }
  }

  private async validateMetadataOnEntity(
    entity: EvidenceDocument,
  ): Promise<void> {
    validateTypeMetadata(entity.document_type, entity.type_metadata, {
      from: entity.reference_period_from,
      to: entity.reference_period_to,
    });

    if (entity.document_type === 'beneficiary_tracer_study') {
      const code = (entity.type_metadata.cohort_code ?? null) as string | null;
      if (code) {
        const cohort = await this.cohortRepo.findOne({ where: { code } });
        if (!cohort) {
          throw new BadRequestException(`Unknown cohort code: ${code}`);
        }
      }
    }
  }

  private describeAttachment(d: EvidenceDocument): string {
    if (d.indicator_id) return `indicator:${d.indicator_id}`;
    if (d.indicator_progress_id) return `progress:${d.indicator_progress_id}`;
    if (d.location_id) return `location:${d.location_id}`;
    return 'orphan';
  }

  private serialize(d: EvidenceDocument): SerializedEvidenceDocument {
    return {
      id: d.id,
      title: d.title,
      description: d.description,
      document_type: d.document_type,
      type_metadata: d.type_metadata ?? {},
      reference_period_from: d.reference_period_from,
      reference_period_to: d.reference_period_to,
      retention_until: d.retention_until
        ? d.retention_until.toISOString()
        : null,
      file_url: d.file_url,
      file_size_bytes: Number(d.file_size_bytes),
      mime_type: d.mime_type,
      sha256: d.sha256,
      uploaded_by: d.uploaded_by,
      uploaded_at: d.uploaded_at.toISOString(),
      updated_at: d.updated_at.toISOString(),
      deleted_at: d.deleted_at ? d.deleted_at.toISOString() : null,
      supersedes_id: d.supersedes_id,
      indicator_id: d.indicator_id,
      indicator_progress_id: d.indicator_progress_id,
      location_id: d.location_id,
    };
  }
}
