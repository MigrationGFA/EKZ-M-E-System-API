import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditFinding } from './audit-finding.entity.js';
import { UpsertAuditFindingDto } from './dto/upsert-audit-finding.dto.js';
import { AuditService } from '../../audit/audit.service.js';

@Injectable()
export class AuditFindingsService {
  constructor(
    @InjectRepository(AuditFinding)
    private readonly repo: Repository<AuditFinding>,
    private readonly auditService: AuditService,
  ) {}

  findAll() {
    return this.repo.find({
      order: { year: 'DESC', order: 'ASC', created_at: 'ASC' },
    });
  }

  async create(dto: UpsertAuditFindingDto, actorId: string, actorName: string) {
    const entity = this.repo.create({
      year: dto.year,
      audit_status: dto.audit_status ?? 'pending_initiation',
      key_issue: dto.key_issue,
      corrective_measures: dto.corrective_measures ?? '',
      comments: dto.comments ?? '',
      expected_submission_date: dto.expected_submission_date
        ? new Date(dto.expected_submission_date)
        : null,
      order: dto.order ?? 0,
    });
    const saved = await this.repo.save(entity);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'audit_finding',
      resource_id: saved.id,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  async update(
    id: string,
    dto: UpsertAuditFindingDto,
    actorId: string,
    actorName: string,
  ) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Audit finding ${id} not found`);
    const before = this.snapshot(existing);
    existing.year = dto.year;
    existing.audit_status = dto.audit_status ?? existing.audit_status;
    existing.key_issue = dto.key_issue;
    existing.corrective_measures =
      dto.corrective_measures ?? existing.corrective_measures;
    existing.comments = dto.comments ?? existing.comments;
    existing.expected_submission_date = dto.expected_submission_date
      ? new Date(dto.expected_submission_date)
      : existing.expected_submission_date;
    existing.order = dto.order ?? existing.order;
    const saved = await this.repo.save(existing);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'audit_finding',
      resource_id: saved.id,
      before_data: before,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  async remove(id: string, actorId: string, actorName: string) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Audit finding ${id} not found`);
    await this.repo.remove(existing);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'delete',
      resource: 'audit_finding',
      resource_id: id,
      before_data: this.snapshot(existing),
    });
  }

  private snapshot(row: AuditFinding) {
    return {
      id: row.id,
      year: row.year,
      audit_status: row.audit_status,
      key_issue: row.key_issue,
      corrective_measures: row.corrective_measures,
      comments: row.comments,
      expected_submission_date: row.expected_submission_date,
      order: row.order,
    };
  }
}
