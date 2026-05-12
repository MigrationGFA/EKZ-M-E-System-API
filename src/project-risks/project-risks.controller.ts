import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectRisksService } from './project-risks.service.js';
import { UpsertRiskDto } from './dto/upsert-risk.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

type JwtReq = { user: { id: string; email: string; role: UserRole } };

@ApiTags('Project Risks')
@ApiBearerAuth('JWT')
@Controller('project-risks')
export class ProjectRisksController {
  constructor(private readonly service: ProjectRisksService) {}

  @Get()
  @ApiOperation({
    summary:
      'List risks. By default returns active (not resolved); pass include_resolved=true for full history.',
  })
  @ApiQuery({ name: 'include_resolved', required: false, type: Boolean })
  findAll(@Query('include_resolved') include_resolved?: string) {
    return this.service.findAll({
      include_resolved: include_resolved === 'true',
    });
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Create a risk entry' })
  create(@Body() dto: UpsertRiskDto, @Request() req: JwtReq) {
    return this.service.create(dto, req.user.id, req.user.email);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Update a risk entry' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertRiskDto,
    @Request() req: JwtReq,
  ) {
    return this.service.update(id, dto, req.user.id, req.user.email);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({
    summary:
      'Mark a risk as resolved (soft delete — preserves the row for audit).',
  })
  resolve(@Param('id', ParseUUIDPipe) id: string, @Request() req: JwtReq) {
    return this.service.resolve(id, req.user.id, req.user.email);
  }
}
