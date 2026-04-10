import { Controller, Get, Query, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service.js';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller('dashboards')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('executive')
  @ApiOperation({
    summary: 'Executive dashboard',
    description:
      'Returns KPIs, monthly trend (6 months), status distribution, SDG progress, recent submissions, and recent unread alerts for the requesting user.',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'ISO date range start',
  })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date range end' })
  @ApiResponse({ status: 200, description: 'Dashboard payload' })
  getExecutive(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.dashboardService.getExecutive(req.user.id, from, to);
  }
}
