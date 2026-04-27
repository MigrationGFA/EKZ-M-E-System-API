import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { InviteUserDto } from './dto/invite-user.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all users (admin only)',
    description:
      'Never returns password_hash. Includes submission_count and is_default_password per user.',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['admin', 'me_staff', 'programme_staff', 'viewer'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or email',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description:
      'Plain array of user objects with submission_count and is_default_password',
  })
  @ApiResponse({ status: 403, description: 'Admin only' })
  findAll(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    return this.usersService.findAll({
      role,
      search,
      page: page ? Number(page) : undefined,
      per_page: per_page ? Number(per_page) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User object' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.usersService.serializeUser(user);
  }

  @Post('invite')
  @ApiOperation({
    summary: 'Create a new user (admin only)',
    description:
      'Creates user with the default password. is_default_password is set to true. Returns 409 if email already exists.',
  })
  @ApiResponse({
    status: 200,
    description: '{ message: "User <email> created successfully" }',
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  invite(@Body() dto: InviteUserDto) {
    return this.usersService.invite(dto.name, dto.email, dto.role);
  }

  @Put(':id/role')
  @ApiOperation({
    summary: "Update a user's role",
    description: 'Writes an audit log entry for the role change.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Full updated user object' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Request() req: { user: { id: string } },
  ) {
    const result = await this.usersService.updateRole(
      id,
      dto.role,
      req.user.id,
    );

    await this.auditService.log({
      user_id: id,
      user_name: result.user.name,
      action: 'update',
      resource: 'user',
      resource_id: id,
      before_data: { role: result.oldRole },
      after_data: { role: dto.role },
    });

    return result.user;
  }

  @Put(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate a user (admin only)',
    description:
      'Deactivated users receive 401 on login. Writes an audit log entry.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'Full user object with active: false',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivate(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    const user = await this.usersService.deactivate(id, req.user.id);

    await this.auditService.log({
      user_id: id,
      user_name: user.name,
      action: 'update',
      resource: 'user',
      resource_id: id,
      before_data: { active: true },
      after_data: { active: false },
    });

    return user;
  }

  @Put(':id/reactivate')
  @ApiOperation({
    summary: 'Reactivate a deactivated user (admin only)',
    description: 'Sets active to true. Writes an audit log entry.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'Full user object with active: true',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async reactivate(@Param('id') id: string) {
    const user = await this.usersService.reactivate(id);

    await this.auditService.log({
      user_id: id,
      user_name: user.name,
      action: 'update',
      resource: 'user',
      resource_id: id,
      before_data: { active: false },
      after_data: { active: true },
    });

    return user;
  }

  @Put(':id/reset-password')
  @ApiOperation({
    summary: 'Reset a user password to default (admin only)',
    description:
      'Resets password to the system default and sets is_default_password to true. Writes an audit log entry.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: '{ message: "Password reset to default" }',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Param('id') id: string) {
    const result = await this.usersService.resetPassword(id);

    await this.auditService.log({
      user_id: id,
      user_name: result.userName,
      action: 'update',
      resource: 'user',
      resource_id: id,
      after_data: { is_default_password: true },
    });

    return { message: result.message };
  }
}
