import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LocationsService } from './locations.service.js';
import { CreateLocationDto } from './dto/create-location.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('projects')
  findAll(@Query('sector') sector?: string, @Query('status') status?: string) {
    return this.locationsService.findAll({ sector, status });
  }

  @Get('projects/:id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Post('projects')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }

  @Put('projects/:id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(id, dto);
  }

  @Delete('projects/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }

  @Get('indicators/:indicatorId')
  getIndicatorLocations(@Param('indicatorId') indicatorId: string) {
    return this.locationsService.getIndicatorLocations(indicatorId);
  }
}
