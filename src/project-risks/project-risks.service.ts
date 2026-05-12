import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ProjectRisk } from './project-risk.entity.js';
import { UpsertRiskDto } from './dto/upsert-risk.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class ProjectRisksService {
  constructor(
    @InjectRepository(ProjectRisk)
    private readonly repo: Repository<ProjectRisk>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Lists risks. By default returns active (not resolved). Pass
   * include_resolved=true to fetch the full history.
   */
  async findAll(filters: { include_resolved?: boolean } = {}) {
    const where = filters.include_resolved ? {} : { resolved_at: IsNull() };
    return this.repo.find({
      where,
      order: { resolved_at: 'ASC', deadline: 'ASC', created_at: 'DESC' },
    });
  }

  async create(dto: UpsertRiskDto, actorId: string, actorName: string) {
    const entity = this.repo.create({
      key_issue: dto.key_issue,
      corrective_action: dto.corrective_action ?? '',
      responsibility: dto.responsibility ?? '',
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      status: dto.status ?? 'pending_initiation',
      comments: dto.comments ?? '',
    });
    const saved = await this.repo.save(entity);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'project_risk',
      resource_id: saved.id,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  async update(
    id: string,
    dto: UpsertRiskDto,
    actorId: string,
    actorName: string,
  ) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Risk ${id} not found`);
    const before = this.snapshot(existing);
    existing.key_issue = dto.key_issue;
    existing.corrective_action =
      dto.corrective_action ?? existing.corrective_action;
    existing.responsibility = dto.responsibility ?? existing.responsibility;
    existing.deadline = dto.deadline
      ? new Date(dto.deadline)
      : existing.deadline;
    existing.status = dto.status ?? existing.status;
    existing.comments = dto.comments ?? existing.comments;
    const saved = await this.repo.save(existing);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'project_risk',
      resource_id: saved.id,
      before_data: before,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  /** Soft-delete: marks resolved_at instead of dropping the row. */
  async resolve(id: string, actorId: string, actorName: string) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Risk ${id} not found`);
    existing.resolved_at = new Date();
    existing.status = 'finalized';
    const saved = await this.repo.save(existing);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'project_risk',
      resource_id: saved.id,
      after_data: { resolved_at: saved.resolved_at, status: saved.status },
    });
    return saved;
  }

  private snapshot(row: ProjectRisk) {
    return {
      id: row.id,
      key_issue: row.key_issue,
      corrective_action: row.corrective_action,
      responsibility: row.responsibility,
      deadline: row.deadline,
      status: row.status,
      comments: row.comments,
      resolved_at: row.resolved_at,
    };
  }
}
