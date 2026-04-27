import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';
import { ApiToken } from './api-token.entity.js';

@Injectable()
export class ApiTokenStrategy extends PassportStrategy(Strategy, 'api-token') {
  constructor(
    @InjectRepository(ApiToken)
    private readonly tokenRepo: Repository<ApiToken>,
  ) {
    super();
  }

  async validate(
    req: Request,
  ): Promise<{ id: string; email: string; role: string }> {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ekz_LIVE_')) {
      throw new UnauthorizedException('Invalid API token');
    }

    const rawToken = authHeader.slice(7); // strip 'Bearer '

    const allTokens = await this.tokenRepo.find();
    for (const stored of allTokens) {
      const match = await bcrypt.compare(rawToken, stored.token_hash);
      if (match) {
        return {
          id: stored.id,
          email: `api-token:${stored.name}`,
          role: 'api_token',
        };
      }
    }

    throw new UnauthorizedException('Invalid API token');
  }
}
