import { Controller, Get, Post, Param, Query, Request } from '@nestjs/common';
import { AlertsService } from './alerts.service.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@Controller('alerts')
@Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
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
  markAllRead(@Request() req: any) {
    return this.alertsService.markAllRead(req.user.id);
  }

  @Post(':id/read')
  markRead(@Param('id') id: string) {
    return this.alertsService.markRead(id);
  }
}
