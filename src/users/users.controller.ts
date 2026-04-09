import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { InviteUserDto } from './dto/invite-user.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

@Controller('users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
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
  invite(@Body() dto: InviteUserDto) {
    return this.usersService.invite(dto.name, dto.email, dto.role);
  }

  @Put(':id/role')
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
