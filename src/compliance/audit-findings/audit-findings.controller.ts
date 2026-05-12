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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditFindingsService } from './audit-findings.service.js';
import { UpsertAuditFindingDto } from './dto/upsert-audit-finding.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';

type JwtReq = { user: { id: string; email: string; role: UserRole } };

@ApiTags('Compliance')
@ApiBearerAuth('JWT')
@Controller('compliance/audit-findings')
export class AuditFindingsController {
  constructor(private readonly service: AuditFindingsService) {}

  @Get()
  @ApiOperation({ summary: 'List audit findings (QPR section C.1.3)' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Create an audit finding' })
  create(@Body() dto: UpsertAuditFindingDto, @Request() req: JwtReq) {
    return this.service.create(dto, req.user.id, req.user.email);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Update an audit finding' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertAuditFindingDto,
    @Request() req: JwtReq,
  ) {
    return this.service.update(id, dto, req.user.id, req.user.email);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an audit finding' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: JwtReq) {
    return this.service.remove(id, req.user.id, req.user.email);
  }
}
