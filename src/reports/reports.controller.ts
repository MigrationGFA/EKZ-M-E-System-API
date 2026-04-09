import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service.js';
import { GenerateReportDto } from './dto/generate-report.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.VIEWER)
  findAll() {
    return this.reportsService.findAll();
  }

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.CREATED)
  generate(@Body() dto: GenerateReportDto, @Request() req: any) {
    const filters: Record<string, any> = {};
    if (dto.indicator_ids) filters.indicator_ids = dto.indicator_ids;
    if (dto.logframe_level_id)
      filters.logframe_level_id = dto.logframe_level_id;
    if (dto.location_id) filters.location_id = dto.location_id;
    if (dto.date_from) filters.date_from = dto.date_from;
    if (dto.date_to) filters.date_to = dto.date_to;

    // Use the user's name from the JWT — we need to fetch it
    // For now use email as the generated_by since JWT only has id/email/role
    const generatedBy: string = req.user.email ?? 'Unknown';

    return this.reportsService.generate(
      dto.title,
      dto.format,
      generatedBy,
      filters,
    );
  }
}
