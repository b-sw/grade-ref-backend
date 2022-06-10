import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MatchesService } from '../../matches/matches.service';
import { UsersService } from '../../users/users.service';
import { User } from '../../entities/user.entity';
import { Match } from '../../entities/match.entity';
import { SmsGradeParams } from '../../matches/params/SmsGradeParams';

@Injectable()
export class MatchGradeGuard implements CanActivate {
  constructor(private matchesService: MatchesService,
              private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params: SmsGradeParams = request.params;
    const observer: User | undefined = await this.usersService.getByPhoneNumber(params.message.msisdn);
    const match: Match | undefined = await this.matchesService.getByObserverSmsId(params.message.id);

    console.log('request in guard is', request.body);

    if (!observer || !match || observer.id !== match.observerId) {
      throw new HttpException('Forbidden.', HttpStatus.FORBIDDEN);
    }
    return true;
  }
}