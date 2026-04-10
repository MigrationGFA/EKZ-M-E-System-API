import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
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
      'Never returns password_hash. Includes submission_count per user.',
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
    description: 'Plain array of user objects with submission_count',
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

  @Post('invite')
  @ApiOperation({
    summary: 'Invite (create) a new user',
    description:
      'Creates user with a temporary password. Returns 409 if email already exists.',
  })
  @ApiResponse({
    status: 200,
    description: '{ message: "Invite sent to ..." }',
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
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    const result = await this.usersService.updateRole(id, dto.role);

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
    summary: 'Deactivate a user',
    description:
      'Deactivated users receive 401 on login. Writes an audit log entry.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'Full user object with active: false',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivate(@Param('id') id: string) {
    const user = await this.usersService.deactivate(id);

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
}
