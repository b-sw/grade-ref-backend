import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { UsersService } from '../../users/users.service';
import { GradeMessage } from '../../matches/dto/update-grade-sms.dto';

@Injectable()
export class MatchGradeGuard implements CanActivate {
  constructor(protected usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    let message: GradeMessage;

    try {
      message = JSON.parse(body.message);
    } catch (_e) {
      throw new HttpException('Invalid body.', HttpStatus.BAD_REQUEST);
    }

    if (!message || !message.msisdn || !message.id || !message.msg) {
      throw new HttpException('Invalid body.', HttpStatus.BAD_REQUEST);
    }

    const observer: User | undefined = await this.usersService.getByPhoneNumber(message.msisdn);

    if (!observer) {
      throw new HttpException('Forbidden.', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
