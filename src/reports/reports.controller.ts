import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { GenerateReportDto } from './dto/generate-report.dto.js';
import { ReportPreviewQueryDto } from './dto/report-preview-query.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { UsersService } from '../users/users.service.js';

type JwtReq = { user: { id: string; email: string; role: string } };

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.ME_STAFF,
    UserRole.PROGRAMME_STAFF,
    UserRole.VIEWER,
  )
  @ApiOperation({ summary: 'List all report metadata records' })
  @ApiResponse({ status: 200, description: 'Plain array of report objects' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get('preview')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({
    summary:
      'Aggregate all data needed to generate a full AfDB-grade M&E report',
    description:
      'Returns executive summary KPIs, logframe rows with nested indicators and trend data, ' +
      'submissions breakdown per indicator, and data quality metrics. ' +
      'Accepts optional date_from / date_to to scope the reporting period.',
  })
  @ApiResponse({ status: 200, description: 'ReportPreviewData object' })
  async preview(@Query() query: ReportPreviewQueryDto, @Request() req: JwtReq) {
    const requestingUser = await this.usersService.findById(req.user.id);
    const generatedBy = requestingUser?.name ?? req.user.email;
    return this.reportsService.getPreviewData(
      generatedBy,
      query.date_from,
      query.date_to,
    );
  }

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record a generated report',
    description:
      'Reports are generated client-side (jsPDF/SheetJS). This endpoint only records the metadata. download_url is always "#".',
  })
  @ApiResponse({
    status: 201,
    description: '{ report_id, download_url, format }',
  })
  async generate(@Body() dto: GenerateReportDto, @Request() req: JwtReq) {
    const filters: Record<string, unknown> = {};
    if (dto.indicator_ids) filters.indicator_ids = dto.indicator_ids;
    if (dto.logframe_level_id)
      filters.logframe_level_id = dto.logframe_level_id;
    if (dto.location_id) filters.location_id = dto.location_id;
    if (dto.date_from) filters.date_from = dto.date_from;
    if (dto.date_to) filters.date_to = dto.date_to;

    const requestingUser = await this.usersService.findById(req.user.id);
    const generatedBy: string = requestingUser?.name ?? req.user.email;
    const generatorEmail: string = requestingUser?.email ?? req.user.email;

    return this.reportsService.generate(
      dto.title,
      dto.format,
      generatedBy,
      filters,
      generatorEmail,
      req.user.id,
    );
  }
}
