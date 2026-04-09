import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepo.update(id, { last_login: new Date() });
  }

  async findAll(filters: {
    role?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) {
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.email',
        'u.name',
        'u.role',
        'u.avatar',
        'u.active',
        'u.last_login',
        'u.created_at',
        'u.updated_at',
      ]);

    if (filters.role) {
      qb.andWhere('u.role = :role', { role: filters.role });
    }
    if (filters.search) {
      qb.andWhere('(u.name ILIKE :search OR u.email ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.page && filters.per_page) {
      qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
    }

    qb.orderBy('u.created_at', 'DESC');
    const users = await qb.getMany();

    // Get submission counts
    const counts: { officer_id: string; count: number }[] =
      await this.usersRepo.manager.query(
        `SELECT officer_id, COUNT(*)::int as count
       FROM submissions
       GROUP BY officer_id`,
      );
    const countMap = new Map<string, number>();
    for (const row of counts) {
      countMap.set(row.officer_id, row.count);
    }

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      active: u.active,
      last_login: u.last_login,
      submission_count: countMap.get(u.id) ?? 0,
    }));
  }

  async invite(name: string, email: string, role: string) {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException(`Email ${email} already exists`);
    }

    // Phase 1: create with temp password, skip actual email
    const tempPassword = 'TempPass123!';
    const hash = await bcrypt.hash(tempPassword, 10);

    const user = this.usersRepo.create({
      name,
      email,
      password_hash: hash,
      role: role as UserRole,
    });
    await this.usersRepo.save(user);

    return { message: `Invite sent to ${email}` };
  }

  async updateRole(id: string, role: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const oldRole = user.role;
    user.role = role as UserRole;
    const saved = await this.usersRepo.save(user);

    return {
      user: this.serializeUser(saved),
      oldRole,
    };
  }

  async deactivate(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.active = false;
    const saved = await this.usersRepo.save(user);
    return this.serializeUser(saved);
  }

  private serializeUser(u: User) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      active: u.active,
      last_login: u.last_login,
    };
  }
}
