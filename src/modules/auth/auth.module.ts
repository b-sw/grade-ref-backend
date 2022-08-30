import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthService } from 'src/modules/auth/auth.service';
import { JwtStrategy } from 'src/modules/auth/strategies/jwt.strategy';
import { AuthController } from 'src/modules/auth/auth.controller';

@Module({
    imports: [UsersModule, JwtModule.register(AuthModule.JWT_OPTIONS)],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {
    private static readonly JWT_EXPIRATION_TIME = '30m';
    private static readonly JWT_OPTIONS = {
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: AuthModule.JWT_EXPIRATION_TIME },
    };
}
