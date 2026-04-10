import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service.js';
import { CreateAuditDto } from './dto/create-audit.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('Audit Log')
@ApiBearerAuth('JWT')
@Controller('audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List audit log entries (admin only)',
    description:
      'Returns newest first. Fields: before/after (not before_data/after_data), timestamp.',
  })
  @ApiQuery({ name: 'user_id', required: false })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'submit'],
  })
  @ApiQuery({ name: 'resource', required: false, example: 'indicator' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'ISO date filter start',
  })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date filter end' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Plain array of audit entries' })
  @ApiResponse({ status: 403, description: 'Admin only' })
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
  @ApiOperation({
    summary: 'Write an audit log entry',
    description:
      'All authenticated roles can write entries. The backend also writes entries server-side for sensitive operations.',
  })
  @ApiResponse({
    status: 201,
    description: 'Created audit entry with id and timestamp',
  })
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
