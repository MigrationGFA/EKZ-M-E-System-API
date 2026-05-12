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
import { CovenantsService } from './covenants.service.js';
import { UpsertCovenantDto } from './dto/upsert-covenant.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';

type JwtReq = { user: { id: string; email: string; role: UserRole } };

@ApiTags('Compliance')
@ApiBearerAuth('JWT')
@Controller('compliance/covenants')
export class CovenantsController {
  constructor(private readonly service: CovenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List project covenants (QPR section C.1.1)' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Create a covenant' })
  create(@Body() dto: UpsertCovenantDto, @Request() req: JwtReq) {
    return this.service.create(dto, req.user.id, req.user.email);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Update a covenant' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertCovenantDto,
    @Request() req: JwtReq,
  ) {
    return this.service.update(id, dto, req.user.id, req.user.email);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a covenant' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: JwtReq) {
    return this.service.remove(id, req.user.id, req.user.email);
  }
}
