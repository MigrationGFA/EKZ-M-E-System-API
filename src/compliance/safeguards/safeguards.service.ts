import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SafeguardMeasure } from './safeguard-measure.entity.js';
import { UpsertSafeguardDto } from './dto/upsert-safeguard.dto.js';
import { AuditService } from '../../audit/audit.service.js';

@Injectable()
export class SafeguardsService {
  constructor(
    @InjectRepository(SafeguardMeasure)
    private readonly repo: Repository<SafeguardMeasure>,
    private readonly auditService: AuditService,
  ) {}

  findAll() {
    return this.repo.find({ order: { order: 'ASC', type: 'ASC' } });
  }

  async create(dto: UpsertSafeguardDto, actorId: string, actorName: string) {
    const entity = this.repo.create({
      type: dto.type,
      measure_name: dto.measure_name,
      total_count: dto.total_count ?? 0,
      not_started_count: dto.not_started_count ?? 0,
      ongoing_count: dto.ongoing_count ?? 0,
      completed_count: dto.completed_count ?? 0,
      budget_allocated_ua: dto.budget_allocated_ua ?? 0,
      amount_disbursed_ua: dto.amount_disbursed_ua ?? 0,
      order: dto.order ?? 0,
    });
    const saved = await this.repo.save(entity);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'safeguard_measure',
      resource_id: saved.id,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  async update(
    id: string,
    dto: UpsertSafeguardDto,
    actorId: string,
    actorName: string,
  ) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Safeguard ${id} not found`);
    const before = this.snapshot(existing);
    existing.type = dto.type;
    existing.measure_name = dto.measure_name;
    existing.total_count = dto.total_count ?? existing.total_count;
    existing.not_started_count =
      dto.not_started_count ?? existing.not_started_count;
    existing.ongoing_count = dto.ongoing_count ?? existing.ongoing_count;
    existing.completed_count = dto.completed_count ?? existing.completed_count;
    existing.budget_allocated_ua =
      dto.budget_allocated_ua ?? existing.budget_allocated_ua;
    existing.amount_disbursed_ua =
      dto.amount_disbursed_ua ?? existing.amount_disbursed_ua;
    existing.order = dto.order ?? existing.order;
    const saved = await this.repo.save(existing);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'safeguard_measure',
      resource_id: saved.id,
      before_data: before,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  async remove(id: string, actorId: string, actorName: string) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Safeguard ${id} not found`);
    await this.repo.remove(existing);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'delete',
      resource: 'safeguard_measure',
      resource_id: id,
      before_data: this.snapshot(existing),
    });
  }

  private snapshot(row: SafeguardMeasure) {
    return {
      id: row.id,
      type: row.type,
      measure_name: row.measure_name,
      total_count: row.total_count,
      not_started_count: row.not_started_count,
      ongoing_count: row.ongoing_count,
      completed_count: row.completed_count,
      budget_allocated_ua: row.budget_allocated_ua,
      amount_disbursed_ua: row.amount_disbursed_ua,
      order: row.order,
    };
  }
}
