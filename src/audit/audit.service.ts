import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEntry } from './audit-entry.entity.js';

export interface AuditLogInput {
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  resource_id: string;
  before_data?: Record<string, any> | null;
  after_data?: Record<string, any> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEntry)
    private readonly auditRepo: Repository<AuditEntry>,
  ) {}

  async findAll(filters: {
    user_id?: string;
    action?: string;
    resource?: string;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
  }) {
    const qb = this.auditRepo.createQueryBuilder('a');

    if (filters.user_id) {
      qb.andWhere('a.user_id = :userId', { userId: filters.user_id });
    }
    if (filters.action) {
      qb.andWhere('a.action = :action', { action: filters.action });
    }
    if (filters.resource) {
      qb.andWhere('a.resource = :resource', { resource: filters.resource });
    }
    if (filters.from) {
      qb.andWhere('a.created_at >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('a.created_at <= :to', { to: filters.to });
    }

    const total = await qb.getCount();

    if (filters.page && filters.per_page) {
      qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
    }

    qb.orderBy('a.created_at', 'DESC');
    const entries = await qb.getMany();

    return {
      data: entries.map((e) => this.serialize(e)),
      total,
      page: filters.page ?? 1,
      per_page: filters.per_page ?? total,
    };
  }

  async create(input: AuditLogInput) {
    const entry = this.auditRepo.create({
      user_id: input.user_id,
      user_name: input.user_name,
      action: input.action,
      resource: input.resource,
      resource_id: input.resource_id,
      before_data: input.before_data ?? null,
      after_data: input.after_data ?? null,
    });
    const saved = await this.auditRepo.save(entry);
    return this.serialize(saved);
  }

  /** Internal method for other services to write audit entries */
  async log(input: AuditLogInput): Promise<void> {
    await this.create(input);
  }

  private serialize(e: AuditEntry) {
    return {
      id: e.id,
      user_id: e.user_id,
      user_name: e.user_name,
      action: e.action,
      resource: e.resource,
      resource_id: e.resource_id,
      before: e.before_data,
      after: e.after_data,
      timestamp: e.created_at,
    };
  }
}
