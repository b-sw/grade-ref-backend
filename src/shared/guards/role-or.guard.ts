import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, mixin, Type } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { OwnerGuard } from './owner.guard';
import { LeagueMatchParams } from '../../matches/params/LeagueMatchParams';
import { MatchesService } from '../../matches/matches.service';
import { Match } from '../../entities/match.entity';
import { uuid } from '../constants/uuid.constant';
import { Role } from '../../users/constants/users.constants';
import { User } from '../../entities/user.entity';
import { LeaguesService } from '../../leagues/leagues.service';

export const RoleOrGuard = (roles: Role[]): Type<CanActivate> => {
  @Injectable()
  class RoleGuardMixin extends OwnerGuard implements CanActivate {
    constructor(protected usersService: UsersService,
                private matchesService: MatchesService,
                private leaguesService: LeaguesService) {
      super(usersService);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const params: LeagueMatchParams = request.params;
      const match: Match | undefined = await this.matchesService.getById(params.matchId);
      const leagueAdmins: User[] = await this.leaguesService.getLeagueAdmins(params.leagueId);

      if (!match) {
        throw new HttpException('Invalid match id ' + params.matchId, HttpStatus.BAD_REQUEST);
      }

      for (const role of roles) {
        if (role === Role.Admin) {
          const isLeagueAdmin = leagueAdmins.some(admin => admin.id === request.user.id);
          if (isLeagueAdmin) {
            return true;
          }
        }

        const userId: uuid = role === Role.Observer ? match.observerId : match.refereeId;

        if (request.user.id === userId) {
          return true;
        }
      }

      return super.canActivate(context);
    }
  }

  return mixin(RoleGuardMixin);
}