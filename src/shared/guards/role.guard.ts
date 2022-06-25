import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, mixin, Type } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { OwnerGuard } from './owner.guard';
import { LeagueMatchParams } from '../../matches/params/LeagueMatchParams';
import { MatchesService } from '../../matches/matches.service';
import { Match } from '../../entities/match.entity';
import { Role } from '../types/role';
import { uuid } from '../types/uuid';

export const RoleGuard = (role: Role.Observer | Role.Referee): Type<CanActivate> => {
  @Injectable()
  class RoleGuardMixin extends OwnerGuard implements CanActivate {
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

      const userId: uuid = role === Role.Observer ? match.observerId : match.refereeId;

      if (request.user.id === userId) {
        return true;
      }
      return super.canActivate(context);
    }
  }

  return mixin(RoleGuardMixin);
}