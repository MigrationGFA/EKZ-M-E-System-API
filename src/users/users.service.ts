import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { MailService } from '../mail/mail.service.js';

const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD ?? 'Password12$';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findAdminAndMeStaff(): Promise<
    Pick<User, 'id' | 'email' | 'name' | 'role'>[]
  > {
    return this.usersRepo.find({
      where: [
        { role: UserRole.ADMIN, active: true },
        { role: UserRole.ME_STAFF, active: true },
      ],
      select: ['id', 'email', 'name', 'role'],
    });
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
        'u.is_default_password',
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
      is_default_password: u.is_default_password,
      last_login: u.last_login,
      submission_count: countMap.get(u.id) ?? 0,
    }));
  }

  async invite(name: string, email: string, role: string) {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException(`Email ${email} already exists`);
    }

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const user = this.usersRepo.create({
      name,
      email,
      password_hash: hash,
      role: role as UserRole,
      is_default_password: true,
    });
    await this.usersRepo.save(user);

    void this.mailService.sendWelcome(email, name, DEFAULT_PASSWORD);

    return { message: `User ${email} created successfully` };
  }

  async resetPassword(id: string): Promise<{ message: string; userName: string }> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    user.password_hash = hash;
    user.is_default_password = true;
    await this.usersRepo.save(user);

    void this.mailService.sendPasswordReset(user.email, user.name, DEFAULT_PASSWORD);

    return { message: 'Password reset to default', userName: user.name };
  }

  async reactivate(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.active = true;
    const saved = await this.usersRepo.save(user);

    void this.mailService.sendAccountReactivated(saved.email, saved.name);

    return this.serializeUser(saved);
  }

  async updateRole(id: string, role: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const oldRole = user.role;
    user.role = role as UserRole;
    const saved = await this.usersRepo.save(user);

    void this.mailService.sendRoleChanged(saved.email, saved.name, oldRole, role);

    return {
      user: this.serializeUser(saved),
      oldRole,
    };
  }

  async deactivate(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.ADMIN) {
      const activeAdminCount = await this.usersRepo.countBy({
        role: UserRole.ADMIN,
        active: true,
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestException('Cannot deactivate the last active admin');
      }
    }

    user.active = false;
    const saved = await this.usersRepo.save(user);

    void this.mailService.sendAccountDeactivated(saved.email, saved.name);

    return this.serializeUser(saved);
  }

  serializeUser(u: User) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      active: u.active,
      is_default_password: u.is_default_password,
      last_login: u.last_login,
    };
  }
}
