import { Controller, Get, Post, Param, Query, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AlertsService } from './alerts.service.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('Alerts')
@ApiBearerAuth('JWT')
@Controller('alerts')
@Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF, UserRole.VIEWER)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({
    summary: 'List alerts for the requesting user',
    description:
      'Returns only alerts belonging to the authenticated user, newest first.',
  })
  @ApiQuery({ name: 'unread_only', required: false, type: Boolean })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['deadline', 'missed_target', 'data_flag', 'sync_success', 'system'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Plain array of alert objects (isRead, timestamp fields)',
  })
  findAll(
    @Request() req: any,
    @Query('unread_only') unread_only?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    return this.alertsService.findAll({
      user_id: req.user.id,
      unread_only: unread_only === 'true',
      type,
      page: page ? Number(page) : undefined,
      per_page: per_page ? Number(per_page) : undefined,
    });
  }

  // readAll BEFORE :id/read to avoid route collision
  @Post('readAll')
  @ApiOperation({ summary: 'Mark all alerts as read for the requesting user' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  markAllRead(@Request() req: any) {
    return this.alertsService.markAllRead(req.user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a single alert as read' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  markRead(@Param('id') id: string) {
    return this.alertsService.markRead(id);
  }
}
