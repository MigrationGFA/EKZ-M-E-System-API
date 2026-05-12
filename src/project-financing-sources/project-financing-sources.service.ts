import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectFinancingSource } from './project-financing-source.entity.js';
import { ProjectMeta } from '../project-meta/project-meta.entity.js';
import { UpsertFinancingSourceDto } from './dto/upsert-financing-source.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class ProjectFinancingSourcesService {
  constructor(
    @InjectRepository(ProjectFinancingSource)
    private readonly repo: Repository<ProjectFinancingSource>,
    @InjectRepository(ProjectMeta)
    private readonly metaRepo: Repository<ProjectMeta>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(): Promise<ProjectFinancingSource[]> {
    return this.repo.find({ order: { order: 'ASC', source_name: 'ASC' } });
  }

  async create(
    dto: UpsertFinancingSourceDto,
    actorId: string,
    actorName: string,
  ): Promise<ProjectFinancingSource> {
    const meta = await this.metaRepo.findOne({ where: {} });
    if (!meta) {
      throw new UnprocessableEntityException(
        'project_meta must be initialised before financing sources can be added',
      );
    }
    const entity = this.repo.create({
      project_meta_id: meta.id,
      source_name: dto.source_name,
      instrument: dto.instrument,
      total_approved_ua: dto.total_approved_ua,
      disbursed_ua: dto.disbursed_ua ?? 0,
      order: dto.order ?? 0,
    });
    const saved = await this.repo.save(entity);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'create',
      resource: 'project_financing_source',
      resource_id: saved.id,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  async update(
    id: string,
    dto: UpsertFinancingSourceDto,
    actorId: string,
    actorName: string,
  ): Promise<ProjectFinancingSource> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Financing source ${id} not found`);
    }
    const before = this.snapshot(existing);
    existing.source_name = dto.source_name;
    existing.instrument = dto.instrument;
    existing.total_approved_ua = dto.total_approved_ua;
    existing.disbursed_ua = dto.disbursed_ua ?? 0;
    existing.order = dto.order ?? existing.order;
    const saved = await this.repo.save(existing);

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'project_financing_source',
      resource_id: saved.id,
      before_data: before,
      after_data: this.snapshot(saved),
    });
    return saved;
  }

  async remove(id: string, actorId: string, actorName: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Financing source ${id} not found`);
    }
    await this.repo.remove(existing);
    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'delete',
      resource: 'project_financing_source',
      resource_id: id,
      before_data: this.snapshot(existing),
    });
  }

  private snapshot(row: ProjectFinancingSource) {
    return {
      id: row.id,
      source_name: row.source_name,
      instrument: row.instrument,
      total_approved_ua: row.total_approved_ua,
      disbursed_ua: row.disbursed_ua,
      order: row.order,
    };
  }
}
