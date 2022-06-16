import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { OwnerGuard } from './owner.guard';
import { LeagueMatchParams } from '../../matches/params/LeagueMatchParams';
import { MatchesService } from '../../matches/matches.service';
import { Match } from '../../entities/match.entity';

@Injectable()
export class ObserverGuard extends OwnerGuard implements CanActivate {
  constructor(protected usersService: UsersService,
              private matchesService: MatchesService) {
    super(usersService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params: LeagueMatchParams = request.params;
    const match: Match | undefined = await this.matchesService.getById(params.matchId);

    if (!match) {
      throw new HttpException('Invalid match id ' + params.matchId, HttpStatus.BAD_REQUEST);
    }

    if (request.user.id === match.observerId) {
      return true;
    }
    return super.canActivate(context);
  }
}
