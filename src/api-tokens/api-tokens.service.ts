import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiToken } from './api-token.entity.js';

@Injectable()
export class ApiTokensService {
  constructor(
    @InjectRepository(ApiToken)
    private readonly tokenRepo: Repository<ApiToken>,
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
    return { success: true };
  }
}
