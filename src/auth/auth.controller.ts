import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './public.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Login and obtain a JWT access token' })
  @ApiResponse({
    status: 200,
    description: 'Returns user profile and JWT token',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or deactivated account',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts — rate limit exceeded',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns the current user profile' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) throw new UnauthorizedException('User not found');
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }
}
