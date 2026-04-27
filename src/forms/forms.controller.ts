import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { FormsService } from './forms.service.js';
import { CreateFormDto } from './dto/create-form.dto.js';
import { UpdateFormDto } from './dto/update-form.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('Forms')
@ApiBearerAuth('JWT')
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @ApiOperation({ summary: 'List all forms' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'published'] })
  @ApiQuery({
    name: 'assigned_to',
    required: false,
    description: 'Filter by assigned user UUID',
  })
  @ApiResponse({ status: 200, description: 'Plain array of form objects' })
  findAll(
    @Query('status') status?: string,
    @Query('assigned_to') assigned_to?: string,
  ) {
    return this.formsService.findAll({ status, assigned_to });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single form by ID' })
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiResponse({ status: 200, description: 'Form object' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Create a new form' })
  @ApiResponse({ status: 201, description: 'Created form' })
  create(@Body() dto: CreateFormDto, @Request() req: any) {
    return this.formsService.create(
      {
        ...dto,
        created_by: req.user.id as string,
      },
      req.user.id as string,
      req.user.email as string,
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @ApiOperation({ summary: 'Update a form (partial)' })
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiResponse({ status: 200, description: 'Updated form' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFormDto,
    @Request() req: any,
  ) {
    return this.formsService.update(
      id,
      dto,
      req.user.id as string,
      req.user.email as string,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a form' })
  @ApiParam({ name: 'id', description: 'Form UUID' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.formsService.remove(
      id,
      req.user.id as string,
      req.user.email as string,
    );
  }
}
