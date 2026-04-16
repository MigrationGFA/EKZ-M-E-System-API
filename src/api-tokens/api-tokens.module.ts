import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiToken } from './api-token.entity.js';
import { ApiTokensService } from './api-tokens.service.js';
import { ApiTokensController } from './api-tokens.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([ApiToken]), UsersModule],
  controllers: [ApiTokensController],
  providers: [ApiTokensService],
})
export class ApiTokensModule {}
