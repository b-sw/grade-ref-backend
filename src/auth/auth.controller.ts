import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ApiProperty } from '@nestjs/swagger';

export class AuthBody {
  @ApiProperty({ type: String })
  googleToken: string;
}

@ApiTags('auth')
@Controller('google')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {
    // Guard redirects
  }

  @Get('redirect')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req) {
    return this.authService.login(req.user);
  }

  @Post('auth')
  async authenticateUser(@Body() authBody: AuthBody) {
    return this.authService.googleLogin(authBody.googleToken);
  }
}