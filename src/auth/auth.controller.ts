import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthBody, AuthBodyDev } from './dto/auth-body.dto';
import { User } from '../entities/user.entity';
import { DevAuthGuard } from './guards/dev-auth.guard';

@ApiTags('auth')
@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google/auth')
  async authenticateUser(@Body() authBody: AuthBody): Promise<Partial<User> & { accessToken: string }> {
    return this.authService.googleLogin(authBody.googleToken);
  }

  @Post('dev/auth')
  @UseGuards(DevAuthGuard)
  async authenticateUserDev(@Body() authBody: AuthBodyDev): Promise<{ accessToken: string }> {
    return this.authService.devLogin(authBody.email);
  }
}