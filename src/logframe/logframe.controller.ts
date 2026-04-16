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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LogframeService } from './logframe.service.js';
import { CreateNodeDto } from './dto/create-node.dto.js';
import { UpdateNodeDto } from './dto/update-node.dto.js';
import { LinkIndicatorDto } from './dto/link-indicator.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('Logframe')
@ApiBearerAuth('JWT')
@Controller('logframe')
export class LogframeController {
  constructor(private readonly logframeService: LogframeService) {}

  @Get()
  @ApiOperation({
    summary: 'Get full logframe tree',
    description:
      'Returns all logframe nodes as a nested tree (Goal → Outcome → Output → Activity), each with linked indicators.',
  })
  @ApiResponse({ status: 200, description: 'Nested array of root goal nodes' })
  getTree() {
    return this.logframeService.getTree();
  }

  @Post('nodes')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Create a new logframe node' })
  @ApiResponse({ status: 201, description: 'Node created successfully' })
  @ApiResponse({ status: 400, description: 'Parent type constraint violation' })
  createNode(@Body() dto: CreateNodeDto, @Request() req: any) {
    return this.logframeService.createNode(dto, req.user.id as string, req.user.email as string);
  }

  @Put('nodes/:id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Update a logframe node (partial)' })
  @ApiParam({ name: 'id', description: 'Node UUID' })
  @ApiResponse({ status: 200, description: 'Updated node' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  updateNode(@Param('id') id: string, @Body() dto: UpdateNodeDto, @Request() req: any) {
    return this.logframeService.updateNode(id, dto, req.user.id as string, req.user.email as string);
  }

  @Delete('nodes/:id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a logframe node' })
  @ApiParam({ name: 'id', description: 'Node UUID' })
  @ApiResponse({ status: 204, description: 'Node deleted' })
  @ApiResponse({
    status: 400,
    description: 'Node has children — remove them first',
  })
  deleteNode(@Param('id') id: string, @Request() req: any) {
    return this.logframeService.deleteNode(id, req.user.id as string, req.user.email as string);
  }

  @Post('nodes/:id/indicators')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Link an indicator to a logframe node' })
  @ApiParam({ name: 'id', description: 'Node UUID' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({
    status: 409,
    description: 'Indicator already linked to this node',
  })
  linkIndicator(@Param('id') id: string, @Body() dto: LinkIndicatorDto, @Request() req: any) {
    return this.logframeService.linkIndicator(id, dto.indicator_id, req.user.id as string, req.user.email as string);
  }

  @Delete('nodes/:nodeId/indicators/:indicatorId')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink an indicator from a logframe node' })
  @ApiParam({ name: 'nodeId', description: 'Node UUID' })
  @ApiParam({ name: 'indicatorId', description: 'Indicator UUID' })
  @ApiResponse({ status: 204, description: 'Unlinked' })
  unlinkIndicator(
    @Param('nodeId') nodeId: string,
    @Param('indicatorId') indicatorId: string,
    @Request() req: any,
  ) {
    return this.logframeService.unlinkIndicator(nodeId, indicatorId, req.user.id as string, req.user.email as string);
  }
}
