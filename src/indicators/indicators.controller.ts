import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { IndicatorsService } from './indicators.service.js';
import { DisaggregationService } from './disaggregation.service.js';
import { CreateIndicatorDto } from './dto/create-indicator.dto.js';
import { UpdateIndicatorDto } from './dto/update-indicator.dto.js';
import { CreateProgressDto } from './dto/create-progress.dto.js';
import { FindIndicatorsQueryDto } from './dto/find-indicators-query.dto.js';
import { SetYearTargetsDto } from './dto/year-target.dto.js';
import {
  RollupQueryDto,
  SetDisaggregationsDto,
} from './dto/disaggregation.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('Indicators')
@ApiBearerAuth('JWT')
@Controller('indicators')
export class IndicatorsController {
  constructor(
    private readonly indicatorsService: IndicatorsService,
    private readonly disaggregationService: DisaggregationService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all indicators',
    description:
      'Returns a plain array. Used for dropdowns and full-list selects.',
  })
  @ApiResponse({ status: 200, description: 'Plain array of indicators' })
  findAll(@Query() query: FindIndicatorsQueryDto) {
    return this.indicatorsService.findAll({
      status: query.status,
      logframe_level_id: query.logframe_level_id,
      sdg_id: query.sdg_id ? Number(query.sdg_id) : undefined,
      frequency: query.frequency,
      kind: query.kind,
      rmf_adoa: query.rmf_adoa,
      data_source_type: query.data_source_type,
      search: query.search,
      page: query.page ? Number(query.page) : undefined,
      per_page: query.per_page ? Number(query.per_page) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single indicator by ID' })
  @ApiParam({ name: 'id', description: 'Indicator UUID' })
  @ApiResponse({ status: 200, description: 'Indicator object' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  findOne(@Param('id') id: string) {
    return this.indicatorsService.findOne(id);
  }

  @Get(':id/progress')
  @ApiOperation({
    summary: 'Get progress history for an indicator',
    description: 'Returns progress entries oldest-first.',
  })
  @ApiParam({ name: 'id', description: 'Indicator UUID' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'ISO date filter start',
  })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date filter end' })
  @ApiResponse({
    status: 200,
    description: 'Array of progress entries (oldest first)',
  })
  getProgress(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.indicatorsService.getProgress(id, from, to);
  }

  @Post(':id/progress')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @ApiOperation({
    summary: 'Log a progress entry for an indicator',
    description:
      'Creates a new progress entry and updates the indicator current_value and status.',
  })
  @ApiParam({ name: 'id', description: 'Indicator UUID' })
  @ApiResponse({
    status: 201,
    description: 'Created progress entry with updated indicator status',
  })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  addProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProgressDto,
    @Request() req: any,
  ) {
    return this.indicatorsService.addProgress(
      id,
      dto,
      req.user.id as string,
      req.user.email as string,
    );
  }

  @Get(':id/forms')
  @ApiOperation({
    summary: 'Get forms linked to an indicator',
    description:
      'Returns forms where this indicator ID is in the indicator_ids array.',
  })
  @ApiParam({ name: 'id', description: 'Indicator UUID' })
  @ApiResponse({ status: 200, description: 'Array of linked forms' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  getLinkedForms(@Param('id') id: string) {
    return this.indicatorsService.getLinkedForms(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({
    summary: 'Create a new indicator',
    description: 'Sets current_value = baseline and computes initial status.',
  })
  @ApiResponse({ status: 201, description: 'Created indicator' })
  create(@Body() dto: CreateIndicatorDto, @Request() req: any) {
    return this.indicatorsService.create(
      dto,
      req.user.id as string,
      req.user.email as string,
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({
    summary: 'Update an indicator (partial)',
    description: 'Recomputes status if current_value or target changes.',
  })
  @ApiParam({ name: 'id', description: 'Indicator UUID' })
  @ApiResponse({ status: 200, description: 'Updated indicator' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIndicatorDto,
    @Request() req: any,
  ) {
    return this.indicatorsService.update(
      id,
      dto,
      req.user.id as string,
      req.user.email as string,
    );
  }

  @Get(':id/year-targets')
  @ApiOperation({
    summary: 'Get the multi-year targets for an indicator',
    description:
      'Returns rows sorted by year ascending. Empty array if none defined.',
  })
  @ApiParam({ name: 'id', description: 'Indicator UUID' })
  @ApiResponse({
    status: 200,
    description: 'Array of year-target rows (sorted ascending by year)',
  })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  getYearTargets(@Param('id', ParseUUIDPipe) id: string) {
    return this.indicatorsService.getYearTargets(id);
  }

  @Put(':id/year-targets')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({
    summary: 'Replace the multi-year targets for an indicator',
    description:
      'Bulk replace — deletes existing rows and inserts the payload atomically. Recomputes indicator status afterwards.',
  })
  @ApiParam({ name: 'id', description: 'Indicator UUID' })
  @ApiResponse({
    status: 200,
    description: 'Persisted year-target rows (sorted ascending by year)',
  })
  @ApiResponse({
    status: 400,
    description: 'Duplicate years in payload',
  })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  setYearTargets(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetYearTargetsDto,
    @Request() req: any,
  ) {
    return this.indicatorsService.setYearTargets(
      id,
      dto,
      req.user.id as string,
      req.user.email as string,
    );
  }

  @Get(':id/disaggregation')
  @ApiOperation({
    summary: 'Get disaggregation rules for an indicator',
    description:
      'Returns one row per axis (sex, age_band, cohort, skill_level, geography, university_origin). Empty array if no rules defined.',
  })
  @ApiParam({ name: 'id', description: 'Indicator UUID' })
  @ApiResponse({ status: 200, description: 'Array of disaggregation rules' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  getDisaggregation(@Param('id', ParseUUIDPipe) id: string) {
    return this.disaggregationService.getRules(id);
  }

  @Put(':id/disaggregation')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({
    summary: 'Replace disaggregation rules for an indicator',
    description:
      'Bulk replace — deletes existing rules and inserts the payload atomically. Each axis may appear at most once.',
  })
  @ApiParam({ name: 'id', description: 'Indicator UUID' })
  @ApiResponse({
    status: 200,
    description: 'Persisted disaggregation rules (sorted ascending by axis)',
  })
  @ApiResponse({ status: 400, description: 'Duplicate axes in payload' })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  setDisaggregation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetDisaggregationsDto,
    @Request() req: any,
  ) {
    return this.disaggregationService.setRules(
      id,
      dto,
      req.user.id as string,
      req.user.email as string,
    );
  }

  @Get(':id/disaggregation/rollup')
  @ApiOperation({
    summary: 'Aggregate disaggregated progress for an indicator on one axis',
    description:
      'Sums value_breakdown JSONB across every progress entry on the given axis. Returns total, per-bucket counts, the matching rule target (if any), and the bucket-keyed gap to target.',
  })
  @ApiParam({ name: 'id', description: 'Indicator UUID' })
  @ApiQuery({
    name: 'axis',
    enum: [
      'sex',
      'age_band',
      'cohort',
      'skill_level',
      'geography',
      'university_origin',
    ],
    description: 'Axis to aggregate over',
  })
  @ApiResponse({
    status: 200,
    description: 'Rollup with total, buckets, target, and gap',
  })
  @ApiResponse({ status: 404, description: 'Indicator not found' })
  getDisaggregationRollup(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RollupQueryDto,
  ) {
    return this.disaggregationService.getRollup(id, query.axis);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an indicator (admin only)' })
  @ApiParam({ name: 'id', description: 'Indicator UUID' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 409, description: 'Indicator has linked submissions' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.indicatorsService.remove(
      id,
      req.user.id as string,
      req.user.email as string,
    );
  }
}
