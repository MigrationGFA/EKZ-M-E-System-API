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
import { IndicatorsService } from './indicators.service.js';
import { CreateIndicatorDto } from './dto/create-indicator.dto.js';
import { UpdateIndicatorDto } from './dto/update-indicator.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@Controller('indicators')
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Get()
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
  findOne(@Param('id') id: string) {
    return this.indicatorsService.findOne(id);
  }

  @Get(':id/progress')
  getProgress(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.indicatorsService.getProgress(id, from, to);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  create(@Body() dto: CreateIndicatorDto) {
    return this.indicatorsService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  update(@Param('id') id: string, @Body() dto: UpdateIndicatorDto) {
    return this.indicatorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.indicatorsService.remove(id);
  }
}
