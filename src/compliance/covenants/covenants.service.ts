import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectCovenant } from './project-covenant.entity.js';
import { UpsertCovenantDto } from './dto/upsert-covenant.dto.js';
import { AuditService } from '../../audit/audit.service.js';

@Injectable()
export class CovenantsService {
  constructor(
    @InjectRepository(ProjectCovenant)
    private readonly repo: Repository<ProjectCovenant>,
    private readonly auditService: AuditService,
  ) {}

  findAll() {
    return this.repo.find({ order: { order: 'ASC', created_at: 'ASC' } });
  }

  async create(dto: UpsertCovenantDto, actorId: string, actorName: string) {
    const entity = this.repo.create({
      covenant_text: dto.covenant_text,
      type: dto.type,
      status: dto.status ?? 'pending_initiation',
      comments: dto.comments ?? '',
      order: dto.order ?? 0,
    });
    const saved = await this.repo.save(entity);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'project_covenant',
      resource_id: saved.id,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  async update(
    id: string,
    dto: UpsertCovenantDto,
    actorId: string,
    actorName: string,
  ) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Covenant ${id} not found`);
    const before = this.snapshot(existing);
    existing.covenant_text = dto.covenant_text;
    existing.type = dto.type;
    existing.status = dto.status ?? existing.status;
    existing.comments = dto.comments ?? existing.comments;
    existing.order = dto.order ?? existing.order;
    const saved = await this.repo.save(existing);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'project_covenant',
      resource_id: saved.id,
      before_data: before,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  async remove(id: string, actorId: string, actorName: string) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Covenant ${id} not found`);
    await this.repo.remove(existing);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'delete',
      resource: 'project_covenant',
      resource_id: id,
      before_data: this.snapshot(existing),
    });
  }

  private snapshot(row: ProjectCovenant) {
    return {
      id: row.id,
      covenant_text: row.covenant_text,
      type: row.type,
      status: row.status,
      comments: row.comments,
      order: row.order,
    };
  }
}
