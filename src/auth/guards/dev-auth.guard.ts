import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AuthBodyDev } from '../dto/auth-body.dto';

@Injectable()
export class DevAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body: AuthBodyDev = request.body;

    console.log('Node env', process.env.NODE_ENV);

    if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
      throw new HttpException('Not dev env.', HttpStatus.BAD_REQUEST);
    }

    if (!body.devPassword || body.devPassword != process.env.DEV_AUTH_PASSWORD) {
      throw new HttpException('Invalid dev auth password.', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
