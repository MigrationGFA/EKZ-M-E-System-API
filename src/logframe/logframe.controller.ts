import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LogframeService } from './logframe.service.js';
import { CreateNodeDto } from './dto/create-node.dto.js';
import { UpdateNodeDto } from './dto/update-node.dto.js';
import { LinkIndicatorDto } from './dto/link-indicator.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@Controller('logframe')
export class LogframeController {
  constructor(private readonly logframeService: LogframeService) {}

  @Get()
  getTree() {
    return this.logframeService.getTree();
  }

  @Post('nodes')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  createNode(@Body() dto: CreateNodeDto) {
    return this.logframeService.createNode(dto);
  }

  @Put('nodes/:id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  updateNode(@Param('id') id: string, @Body() dto: UpdateNodeDto) {
    return this.logframeService.updateNode(id, dto);
  }

  @Delete('nodes/:id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNode(@Param('id') id: string) {
    return this.logframeService.deleteNode(id);
  }

  @Post('nodes/:id/indicators')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  linkIndicator(@Param('id') id: string, @Body() dto: LinkIndicatorDto) {
    return this.logframeService.linkIndicator(id, dto.indicator_id);
  }

  @Delete('nodes/:nodeId/indicators/:indicatorId')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkIndicator(
    @Param('nodeId') nodeId: string,
    @Param('indicatorId') indicatorId: string,
  ) {
    return this.logframeService.unlinkIndicator(nodeId, indicatorId);
  }
}
