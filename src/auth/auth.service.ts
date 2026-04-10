import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.active) throw new UnauthorizedException('Account is deactivated');

    await this.usersService.updateLastLogin(user.id);

    void this.auditService.log({
      user_id: user.id,
      user_name: user.name,
      action: 'login',
      resource: 'user',
      resource_id: user.id,
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    };
  }
}
