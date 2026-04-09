import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { CreateAuditDto } from './dto/create-audit.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@Controller('audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('user_id') user_id?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    return this.auditService.findAll({
      user_id,
      action,
      resource,
      from,
      to,
      page: page ? Number(page) : undefined,
      per_page: per_page ? Number(per_page) : undefined,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAuditDto) {
    return this.auditService.create({
      user_id: dto.user_id,
      user_name: dto.user_name,
      action: dto.action,
      resource: dto.resource,
      resource_id: dto.resource_id,
      before_data: dto.before ?? null,
      after_data: dto.after ?? null,
    });
  }
}
