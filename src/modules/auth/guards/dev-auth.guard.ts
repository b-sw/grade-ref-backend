import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthBodyDev } from 'src/modules/auth/dto/auth-body.dto';

@Injectable()
export class DevAuthGuard implements CanActivate {
  static readonly DEV_ENV = 'development';
  static readonly NOT_DEV_ENV_MESSAGE = 'Not dev env.';
  static readonly INVALID_DEV_AUTH_PASSWORD_MESSAGE = 'Invalid dev auth password.';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body: AuthBodyDev = request.body;

    const isDevEnv = !process.env.NODE_ENV || process.env.NODE_ENV === DevAuthGuard.DEV_ENV;
    if (!isDevEnv) {
      throw new HttpException(DevAuthGuard.NOT_DEV_ENV_MESSAGE, HttpStatus.BAD_REQUEST);
    }

    const isValidDevAuthPassword = !body.devPassword && body.devPassword === process.env.DEV_AUTH_PASSWORD;
    if (isValidDevAuthPassword) {
      throw new HttpException(DevAuthGuard.INVALID_DEV_AUTH_PASSWORD_MESSAGE, HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
