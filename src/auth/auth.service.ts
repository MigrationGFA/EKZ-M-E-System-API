import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { AuditService } from '../audit/audit.service.js';
import { MailService } from '../mail/mail.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.active) throw new UnauthorizedException('Account is deactivated');

    await this.usersService.updateLastLogin(user.id);

    void this.auditService.log({
      user_id: user.id,
      user_name: user.name,
      action: 'login',
      resource: 'user',
      resource_id: user.id,
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        is_default_password: user.is_default_password,
      },
      token,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid)
      throw new UnauthorizedException('Current password is incorrect');

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.is_default_password = false;
    await this.usersRepo.save(user);

    void this.mailService.sendPasswordChanged(user.email, user.name);

    void this.auditService.log({
      user_id: user.id,
      user_name: user.name,
      action: 'update',
      resource: 'user',
      resource_id: user.id,
      after_data: { is_default_password: false },
    });

    return { message: 'Password updated successfully' };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    // Silently return for unknown / inactive emails — prevents user enumeration.
    if (!user?.active) return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    user.password_reset_token = tokenHash;
    user.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.usersRepo.save(user);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
    this.mailService.sendForgotPasswordLink(user.email, user.name, resetLink);
  }

  async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const user = await this.usersRepo.findOne({
      where: { password_reset_token: tokenHash },
    });

    if (
      !user?.password_reset_expires ||
      user.password_reset_expires < new Date()
    ) {
      throw new BadRequestException(
        'Password reset link is invalid or has expired',
      );
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.is_default_password = false;
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await this.usersRepo.save(user);

    this.mailService.sendPasswordChanged(user.email, user.name);

    void this.auditService.log({
      user_id: user.id,
      user_name: user.name,
      action: 'update',
      resource: 'user',
      resource_id: user.id,
      after_data: { password_reset: true },
    });
  }
}
