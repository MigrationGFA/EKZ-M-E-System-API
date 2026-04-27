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
import { CreateIndicatorDto } from './dto/create-indicator.dto.js';
import { UpdateIndicatorDto } from './dto/update-indicator.dto.js';
import { CreateProgressDto } from './dto/create-progress.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('Indicators')
@ApiBearerAuth('JWT')
@Controller('indicators')
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all indicators',
    description:
      'Returns a plain array. Used for dropdowns and full-list selects.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['on_track', 'at_risk', 'off_track'],
  })
  @ApiQuery({
    name: 'logframe_level_id',
    required: false,
    description: 'Filter by logframe node UUID',
  })
  @ApiQuery({ name: 'sdg_id', required: false, type: Number })
  @ApiQuery({
    name: 'frequency',
    required: false,
    enum: ['monthly', 'quarterly', 'bi_annually', 'annually'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or code (ILIKE)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Plain array of indicators' })
  findAll(
    @Query('status') status?: string,
    @Query('logframe_level_id') logframe_level_id?: string,
    @Query('sdg_id') sdg_id?: string,
    @Query('frequency') frequency?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    return this.indicatorsService.findAll({
      status,
      logframe_level_id,
      sdg_id: sdg_id ? Number(sdg_id) : undefined,
      frequency,
      search,
      page: page ? Number(page) : undefined,
      per_page: per_page ? Number(per_page) : undefined,
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
