import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiToken } from './api-token.entity.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class ApiTokensService {
  constructor(
    @InjectRepository(ApiToken)
    private readonly tokenRepo: Repository<ApiToken>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async findAll() {
    const tokens = await this.tokenRepo.find({
      order: { created_at: 'DESC' },
    });
    return tokens.map((t) => ({
      id: t.id,
      name: t.name,
      tokenPart: t.token_prefix,
      createdAt: t.created_at,
    }));
  }

  async create(name: string) {
    const rawToken = 'ekz_LIVE_' + randomBytes(16).toString('hex');
    const tokenPrefix =
      rawToken.substring(0, 14) + '****...' + rawToken.slice(-3);
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const token = this.tokenRepo.create({
      name,
      token_hash: tokenHash,
      token_prefix: tokenPrefix,
    });
    const saved = await this.tokenRepo.save(token);

    void this.notifyAdmins((emails) =>
      this.mailService.sendTokenCreated(emails, name, saved.token_prefix),
    );

    return {
      id: saved.id,
      name: saved.name,
      tokenPart: saved.token_prefix,
      createdAt: saved.created_at,
      rawToken,
    };
  }

  async remove(id: string) {
    const token = await this.tokenRepo.findOne({ where: { id } });
    if (!token) throw new NotFoundException('Token not found');
    await this.tokenRepo.remove(token);

    void this.notifyAdmins((emails) =>
      this.mailService.sendTokenRevoked(emails, token.name),
    );

    return { success: true };
  }

  private async notifyAdmins(
    send: (emails: string[]) => void,
  ): Promise<void> {
    const admins = await this.usersService.findAdminAndMeStaff();
    const emails = admins.map((u) => u.email);
    if (emails.length > 0) {
      send(emails);
    }
  }
}
