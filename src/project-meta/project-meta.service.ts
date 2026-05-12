import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMeta } from './project-meta.entity.js';
import { LogframeNode } from '../logframe/logframe-node.entity.js';
import { UpsertProjectMetaDto } from './dto/upsert-project-meta.dto.js';
import { AuditService } from '../audit/audit.service.js';

/**
 * Single-row resource. Enforced at the service layer via findOne({}) which
 * returns the first row in the table. There is no DB-level uniqueness
 * constraint (would require a partial unique index) — concurrent direct
 * INSERTs from outside this service could create a second row, but the
 * UI / API path always upserts.
 */
@Injectable()
export class ProjectMetaService {
  constructor(
    @InjectRepository(ProjectMeta)
    private readonly metaRepo: Repository<ProjectMeta>,
    @InjectRepository(LogframeNode)
    private readonly nodeRepo: Repository<LogframeNode>,
    private readonly auditService: AuditService,
  ) {}

  async get(): Promise<ProjectMeta> {
    const meta = await this.metaRepo.findOne({ where: {} });
    if (!meta) {
      throw new NotFoundException(
        'Project metadata has not been initialised yet',
      );
    }
    return meta;
  }

  async upsert(
    dto: UpsertProjectMetaDto,
    actorId: string,
    actorName: string,
  ): Promise<ProjectMeta> {
    if (dto.completion_year <= dto.baseline_year) {
      throw new BadRequestException(
        'completion_year must be greater than baseline_year',
      );
    }

    if (dto.pdo_node_id) {
      const node = await this.nodeRepo.findOne({
        where: { id: dto.pdo_node_id },
      });
      if (!node) {
        throw new UnprocessableEntityException(
          `Logframe node ${dto.pdo_node_id} does not exist`,
        );
      }
      if (node.type !== 'pdo') {
        throw new UnprocessableEntityException(
          `Logframe node ${dto.pdo_node_id} is type "${node.type}"; pdo_node_id must reference a node of type "pdo"`,
        );
      }
    }

    const existing = await this.metaRepo.findOne({ where: {} });

    if (existing) {
      const beforeData = this.snapshot(existing);
      Object.assign(existing, this.dtoToPersist(dto));
      const saved = await this.metaRepo.save(existing);

      void this.auditService.log({
        user_id: actorId,
        user_name: actorName,
        action: 'update',
        resource: 'project_meta',
        resource_id: saved.id,
        before_data: beforeData,
        after_data: this.snapshot(saved),
      });

      return saved;
    }

    const created = this.metaRepo.create(this.dtoToPersist(dto));
    const saved = await this.metaRepo.save(created);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'project_meta',
      resource_id: saved.id,
      after_data: this.snapshot(saved),
    });

    return saved;
  }

  private dtoToPersist(dto: UpsertProjectMetaDto): Partial<ProjectMeta> {
    return {
      name: dto.name,
      sap_code: dto.sap_code ?? null,
      pdo_text: dto.pdo_text,
      baseline_year: dto.baseline_year,
      completion_year: dto.completion_year,
      midpoint_date: dto.midpoint_date ? new Date(dto.midpoint_date) : null,
      pdo_node_id: dto.pdo_node_id ?? null,
      // Phase 9.5 — QPR cover widening
      sector: dto.sector ?? null,
      country: dto.country ?? 'Nigeria',
      executing_agency: dto.executing_agency ?? null,
      responsible_project_staff: dto.responsible_project_staff ?? null,
      original_disbursement_deadline: dto.original_disbursement_deadline
        ? new Date(dto.original_disbursement_deadline)
        : null,
      revised_disbursement_deadline: dto.revised_disbursement_deadline
        ? new Date(dto.revised_disbursement_deadline)
        : null,
    };
  }

  private snapshot(meta: ProjectMeta) {
    return {
      id: meta.id,
      name: meta.name,
      sap_code: meta.sap_code,
      pdo_text: meta.pdo_text,
      baseline_year: meta.baseline_year,
      completion_year: meta.completion_year,
      midpoint_date: meta.midpoint_date,
      pdo_node_id: meta.pdo_node_id,
      sector: meta.sector,
      country: meta.country,
      executing_agency: meta.executing_agency,
      responsible_project_staff: meta.responsible_project_staff,
      original_disbursement_deadline: meta.original_disbursement_deadline,
      revised_disbursement_deadline: meta.revised_disbursement_deadline,
    };
  }
}
