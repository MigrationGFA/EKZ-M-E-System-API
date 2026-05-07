import { Body, Controller, Get, Put, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectMetaService } from './project-meta.service.js';
import { UpsertProjectMetaDto } from './dto/upsert-project-meta.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('Project Meta')
@ApiBearerAuth('JWT')
@Controller('project-meta')
export class ProjectMetaController {
  constructor(private readonly metaService: ProjectMetaService) {}

  @Get()
  @ApiOperation({
    summary: 'Get project metadata (singleton)',
    description:
      'Returns the single project_meta row. Any authenticated user may read.',
  })
  @ApiResponse({ status: 200, description: 'Project metadata object' })
  @ApiResponse({
    status: 404,
    description: 'Project metadata has not been initialised yet',
  })
  get() {
    return this.metaService.get();
  }

  @Put()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Upsert project metadata (admin only)',
    description:
      'Creates the row on first call; updates it on subsequent calls. ' +
      'Validates completion_year > baseline_year and that pdo_node_id ' +
      '(if provided) references a logframe node of type "pdo".',
  })
  @ApiResponse({ status: 200, description: 'Saved project metadata object' })
  @ApiResponse({
    status: 400,
    description: 'completion_year must be greater than baseline_year',
  })
  @ApiResponse({
    status: 422,
    description: 'pdo_node_id does not exist or is not type "pdo"',
  })
  upsert(
    @Body() dto: UpsertProjectMetaDto,
    @Request() req: { user: { id: string; email: string } },
  ) {
    return this.metaService.upsert(dto, req.user.id, req.user.email);
  }
}
