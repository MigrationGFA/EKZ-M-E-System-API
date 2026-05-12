import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityQuarterlyStatus } from './activity-quarterly-status.entity.js';
import { LogframeNode } from '../logframe/logframe-node.entity.js';
import { UpsertAwpStatusDto } from './dto/upsert-awp-status.dto.js';
import { AuditService } from '../audit/audit.service.js';

/**
 * Phase 9.5 — QPR section C.2 AWP status workflow.
 *
 * UPSERT semantics keyed by (logframe_node_id, year, quarter). Service-
 * level guard asserts the referenced node is type='activity'; we don't
 * enforce in DB because cross-table CHECKs are clumsy in Postgres.
 */
@Injectable()
export class AwpStatusService {
  constructor(
    @InjectRepository(ActivityQuarterlyStatus)
    private readonly repo: Repository<ActivityQuarterlyStatus>,
    @InjectRepository(LogframeNode)
    private readonly nodeRepo: Repository<LogframeNode>,
    private readonly auditService: AuditService,
  ) {}

  async findByPeriod(year: number, quarter: number) {
    return this.repo.find({
      where: { year, quarter },
      order: { created_at: 'ASC' },
    });
  }

  async upsert(
    nodeId: string,
    year: number,
    quarter: number,
    dto: UpsertAwpStatusDto,
    actorId: string,
    actorName: string,
  ): Promise<ActivityQuarterlyStatus> {
    if (quarter < 1 || quarter > 4) {
      throw new UnprocessableEntityException(
        `quarter must be between 1 and 4 (got ${quarter})`,
      );
    }
    const node = await this.nodeRepo.findOne({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException(`Logframe node ${nodeId} not found`);
    }
    if (node.type !== 'activity') {
      throw new UnprocessableEntityException(
        `Logframe node ${nodeId} has type "${node.type}"; AWP status rows are only allowed against activity nodes`,
      );
    }

    const existing = await this.repo.findOne({
      where: { logframe_node_id: nodeId, year, quarter },
    });

    if (existing) {
      const before = this.snapshot(existing);
      existing.status = dto.status ?? existing.status;
      existing.pct_achievement =
        dto.pct_achievement ?? existing.pct_achievement;
      existing.comments = dto.comments ?? existing.comments;
      existing.planned_for_next_qtr =
        dto.planned_for_next_qtr ?? existing.planned_for_next_qtr;
      existing.deadline = dto.deadline
        ? new Date(dto.deadline)
        : existing.deadline;
      const saved = await this.repo.save(existing);
      void this.auditService.log({
        user_id: actorId,
        user_name: actorName,
        action: 'update',
        resource: 'activity_quarterly_status',
        resource_id: saved.id,
        before_data: before,
        after_data: this.snapshot(saved),
      });
      return saved;
    }

    const fresh = this.repo.create({
      logframe_node_id: nodeId,
      year,
      quarter,
      status: dto.status ?? 'pending_initiation',
      pct_achievement: dto.pct_achievement ?? 0,
      comments: dto.comments ?? '',
      planned_for_next_qtr: dto.planned_for_next_qtr ?? false,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
    });
    const saved = await this.repo.save(fresh);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'activity_quarterly_status',
      resource_id: saved.id,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  private snapshot(row: ActivityQuarterlyStatus) {
    return {
      id: row.id,
      logframe_node_id: row.logframe_node_id,
      year: row.year,
      quarter: row.quarter,
      status: row.status,
      pct_achievement: row.pct_achievement,
      comments: row.comments,
      planned_for_next_qtr: row.planned_for_next_qtr,
      deadline: row.deadline,
    };
  }
}
