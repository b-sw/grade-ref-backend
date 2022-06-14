import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class MatchGradeGuard implements CanActivate {
  constructor(protected usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const dto = request.body;

    if (!dto.message || !dto.message.msisdn || !dto.message.msg || !dto.id) {
      throw new HttpException('Invalid body.', HttpStatus.BAD_REQUEST);
    }

    const observer: User | undefined = await this.usersService.getByPhoneNumber(dto.message.msisdn);

    if (!observer) {
      throw new HttpException('Forbidden.', HttpStatus.FORBIDDEN);
    }
    return true;
  }
}