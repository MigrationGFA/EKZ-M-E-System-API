import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CohortsService } from './cohorts.service.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('Cohorts')
@ApiBearerAuth('JWT')
@Controller('cohorts')
export class CohortsController {
  constructor(private readonly service: CohortsService) {}

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.ME_STAFF,
    UserRole.PROGRAMME_STAFF,
    UserRole.VIEWER,
  )
  @ApiOperation({
    summary: 'List the 12 canonical cohorts (ADR 0003)',
    description:
      'Read-only catalogue. Available to all authenticated roles for filter UIs.',
  })
  findAll() {
    return this.service.findAll();
  }
}
