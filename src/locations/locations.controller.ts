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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service.js';
import { CreateLocationDto } from './dto/create-location.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('Locations')
@ApiBearerAuth('JWT')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('projects')
  @ApiOperation({
    summary: 'Get all project locations as GeoJSON FeatureCollection',
    description:
      'status and completion are computed live from linked indicators — never stored. GeoJSON coordinates are [lng, lat].',
  })
  @ApiQuery({ name: 'sector', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['on_track', 'at_risk', 'off_track', 'no_data'],
  })
  @ApiResponse({ status: 200, description: 'GeoJSON FeatureCollection' })
  findAll(@Query('sector') sector?: string, @Query('status') status?: string) {
    return this.locationsService.findAll({ sector, status });
  }

  @Get('projects/:id')
  @ApiOperation({
    summary:
      'Get a single project location (properties object, not GeoJSON wrapper)',
  })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({
    status: 200,
    description: 'Location properties with computed status and completion',
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Post('projects')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Create a new project location' })
  @ApiResponse({ status: 201, description: 'Created location properties' })
  create(@Body() dto: CreateLocationDto, @Request() req: any) {
    return this.locationsService.create({ ...dto, created_by: req.user.id as string }, req.user.id as string, req.user.email as string);
  }

  @Put('projects/:id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Update a project location (partial)' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'Updated location properties' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto, @Request() req: any) {
    return this.locationsService.update(id, dto, req.user.id as string, req.user.email as string);
  }

  @Delete('projects/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project location (admin only)' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.locationsService.remove(id, req.user.id as string, req.user.email as string);
  }

  @Get('indicators/:indicatorId')
  @ApiOperation({
    summary:
      'Get GeoJSON FeatureCollection of submission locations for an indicator',
  })
  @ApiParam({ name: 'indicatorId', description: 'Indicator UUID' })
  @ApiResponse({
    status: 200,
    description: 'GeoJSON FeatureCollection of data collection points',
  })
  getIndicatorLocations(@Param('indicatorId') indicatorId: string) {
    return this.locationsService.getIndicatorLocations(indicatorId);
  }
}
