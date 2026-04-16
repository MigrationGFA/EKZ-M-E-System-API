import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ApiToken } from './api-token.entity.js';
import { ApiTokensService } from './api-tokens.service.js';
import { ApiTokensController } from './api-tokens.controller.js';
import { ApiTokenStrategy } from './api-token.strategy.js';
import { UsersModule } from '../users/users.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([ApiToken]), UsersModule, AuditModule, PassportModule],
  controllers: [ApiTokensController],
  providers: [ApiTokensService, ApiTokenStrategy],
})
export class ApiTokensModule {}
