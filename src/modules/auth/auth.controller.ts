import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/modules/auth/auth.service';
import { UserCredentialsType } from 'src/modules/auth/types/user-credentials.type';
import { DevAuthGuard } from 'src/modules/auth/guards/dev-auth.guard';
import { AuthBody, AuthBodyDev } from 'src/modules/auth/dto/auth-body.dto';

@ApiTags(AuthController.AUTH_API_TAG)
@Controller('')
export class AuthController {
    private static readonly AUTH_API_TAG = 'auth';

    constructor(private readonly authService: AuthService) {}

    @Post('google/auth')
    async authenticateUser(@Body() authBody: AuthBody): Promise<UserCredentialsType> {
        return this.authService.googleLogin(authBody.googleToken);
    }

    @Post('dev/auth')
    @UseGuards(DevAuthGuard)
    async authenticateUserDev(@Body() authBody: AuthBodyDev): Promise<{ accessToken: string }> {
        return this.authService.devLogin(authBody.email);
    }
}
