import { Controller, Get, Query, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboards')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('executive')
  getExecutive(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.dashboardService.getExecutive(req.user.id, from, to);
  }
}
