import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alert.entity.js';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepo: Repository<Alert>,
  ) {}

  async findAll(filters: {
    unread_only?: boolean;
    type?: string;
    page?: number;
    per_page?: number;
    user_id?: string;
  }) {
    const qb = this.alertRepo.createQueryBuilder('a');

    if (filters.user_id) {
      qb.andWhere('a.user_id = :userId', { userId: filters.user_id });
    }
    if (filters.unread_only) {
      qb.andWhere('a.is_read = false');
    }
    if (filters.type) {
      qb.andWhere('a.type = :type', { type: filters.type });
    }
    if (filters.page && filters.per_page) {
      qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
    }

    qb.orderBy('a.created_at', 'DESC');
    const alerts = await qb.getMany();
    return alerts.map((a) => this.serialize(a));
  }

  async markRead(id: string) {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    alert.is_read = true;
    await this.alertRepo.save(alert);
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.alertRepo
      .createQueryBuilder()
      .update(Alert)
      .set({ is_read: true })
      .where('user_id = :userId AND is_read = false', { userId })
      .execute();
    return { success: true };
  }

  private serialize(a: Alert) {
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
      isRead: a.is_read,
      timestamp: a.created_at,
    };
  }
}
