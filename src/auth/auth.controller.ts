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
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
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
    description:
      'Returns user profile and JWT token. is_default_password is true if the user has never changed their password.',
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
        is_default_password: user.is_default_password,
      },
    };
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Request a password reset link via email' })
  @ApiResponse({
    status: 201,
    description: 'Always returns success to prevent user enumeration',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message:
        'If that email is registered, a password reset link has been sent.',
    };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using the token from the email link' })
  @ApiResponse({ status: 201, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPasswordWithToken(dto.token, dto.new_password);
    return { message: 'Password has been reset. You can now log in.' };
  }

  @Post('change-password')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Change own password',
    description:
      'Authenticated users change their own password. Sets is_default_password to false on success.',
  })
  @ApiResponse({
    status: 201,
    description: '{ message: "Password updated successfully" }',
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.id,
      dto.current_password,
      dto.new_password,
    );
  }
}
