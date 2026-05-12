import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AwpStatusService } from './awp-status.service.js';
import { UpsertAwpStatusDto } from './dto/upsert-awp-status.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

type JwtReq = { user: { id: string; email: string; role: UserRole } };

@ApiTags('AWP Status')
@ApiBearerAuth('JWT')
@Controller('awp-status')
export class AwpStatusController {
  constructor(private readonly service: AwpStatusService) {}

  @Get()
  @ApiOperation({
    summary:
      'List AWP activity status rows for a given (year, quarter). Frontend joins with logframe activity nodes.',
  })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'quarter', required: true, type: Number })
  findByPeriod(
    @Query('year', ParseIntPipe) year: number,
    @Query('quarter', ParseIntPipe) quarter: number,
  ) {
    return this.service.findByPeriod(year, quarter);
  }

  @Put(':nodeId/:year/:quarter')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({
    summary:
      'Upsert AWP status for one (activity, year, quarter). Service rejects non-activity nodes with 422.',
  })
  @ApiResponse({
    status: 422,
    description: 'logframe node is not type=activity, or quarter out of range',
  })
  upsert(
    @Param('nodeId', ParseUUIDPipe) nodeId: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('quarter', ParseIntPipe) quarter: number,
    @Body() dto: UpsertAwpStatusDto,
    @Request() req: JwtReq,
  ) {
    return this.service.upsert(
      nodeId,
      year,
      quarter,
      dto,
      req.user.id,
      req.user.email,
    );
  }
}
