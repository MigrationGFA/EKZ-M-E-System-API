import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { QuarterlyReportsService } from './quarterly-reports.service.js';
import { UpsertQuarterlyReportDto } from './dto/upsert-quarterly-report.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

type JwtReq = { user: { id: string; email: string; role: UserRole } };

@ApiTags('Quarterly Reports')
@ApiBearerAuth('JWT')
@Controller('quarterly-reports')
export class QuarterlyReportsController {
  constructor(private readonly service: QuarterlyReportsService) {}

  @Get(':year/:quarter')
  @ApiOperation({
    summary:
      'Get the QPR narrative row for (year, quarter). Auto-creates a blank row if missing.',
  })
  @ApiResponse({ status: 200, description: 'QPR narrative row' })
  @ApiResponse({
    status: 422,
    description: 'quarter must be 1-4',
  })
  async findOrCreate(
    @Param('year', ParseIntPipe) year: number,
    @Param('quarter', ParseIntPipe) quarter: number,
    @Request() req: JwtReq,
  ) {
    return this.service.getOrCreate(year, quarter, req.user.id, req.user.email);
  }

  @Put(':year/:quarter')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({
    summary:
      'Upsert the QPR narrative row for (year, quarter). UPSERT — re-running with the same period updates in place.',
  })
  upsert(
    @Param('year', ParseIntPipe) year: number,
    @Param('quarter', ParseIntPipe) quarter: number,
    @Body() dto: UpsertQuarterlyReportDto,
    @Request() req: JwtReq,
  ) {
    return this.service.upsert(year, quarter, dto, req.user.id, req.user.email);
  }
}
