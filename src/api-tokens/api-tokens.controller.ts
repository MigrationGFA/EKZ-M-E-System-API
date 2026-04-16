import {
  Controller,
  Get,
  Post,
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
import { ApiTokensService } from './api-tokens.service.js';
import { CreateTokenDto } from './dto/create-token.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('API Tokens')
@ApiBearerAuth('JWT')
@Controller('api-tokens')
@Roles(UserRole.ADMIN)
export class ApiTokensController {
  constructor(private readonly apiTokensService: ApiTokensService) {}

  @Get()
  @ApiOperation({
    summary: 'List all API tokens (masked)',
    description:
      'Never returns token_hash or rawToken. Only tokenPart (partial token for display).',
  })
  @ApiResponse({ status: 200, description: 'Array of masked token objects' })
  findAll() {
    return this.apiTokensService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new API token',
    description:
      'Generates a random token (ekz_LIVE_ + 32 hex chars). Stores the bcrypt hash. The rawToken is returned ONLY in this response — it cannot be retrieved again.',
  })
  @ApiResponse({
    status: 201,
    description: 'Token object including rawToken (one-time only)',
  })
  create(@Body() dto: CreateTokenDto, @Request() req: any) {
    return this.apiTokensService.create(dto.name, req.user.id as string, req.user.email as string);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (revoke) an API token' })
  @ApiParam({ name: 'id', description: 'Token UUID' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.apiTokensService.remove(id, req.user.id as string, req.user.email as string);
  }
}
