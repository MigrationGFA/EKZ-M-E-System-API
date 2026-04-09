import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTokensService } from './api-tokens.service.js';
import { CreateTokenDto } from './dto/create-token.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@Controller('api-tokens')
@Roles(UserRole.ADMIN)
export class ApiTokensController {
  constructor(private readonly apiTokensService: ApiTokensService) {}

  @Get()
  findAll() {
    return this.apiTokensService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTokenDto) {
    return this.apiTokensService.create(dto.name);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apiTokensService.remove(id);
  }
}
