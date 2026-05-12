import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ProjectFinancingSourcesService } from './project-financing-sources.service.js';
import { UpsertFinancingSourceDto } from './dto/upsert-financing-source.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

type JwtReq = { user: { id: string; email: string; role: UserRole } };

@ApiTags('Project Financing Sources')
@ApiBearerAuth('JWT')
@Controller('project-meta/financing-sources')
export class ProjectFinancingSourcesController {
  constructor(private readonly service: ProjectFinancingSourcesService) {}

  @Get()
  @ApiOperation({
    summary:
      'List financing-source rows (Phase 9.5 QPR cover A.1). Ordered by `order`.',
  })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Create a financing-source row' })
  @ApiResponse({
    status: 422,
    description: 'project_meta must be initialised first',
  })
  create(@Body() dto: UpsertFinancingSourceDto, @Request() req: JwtReq) {
    return this.service.create(dto, req.user.id, req.user.email);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Update a financing-source row' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertFinancingSourceDto,
    @Request() req: JwtReq,
  ) {
    return this.service.update(id, dto, req.user.id, req.user.email);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a financing-source row' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: JwtReq) {
    return this.service.remove(id, req.user.id, req.user.email);
  }
}
