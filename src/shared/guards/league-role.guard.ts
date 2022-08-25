import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, mixin, Type } from '@nestjs/common';
import { LeaguesService } from 'src/modules/leagues/leagues.service';
import { UsersService } from 'src/modules/users/users.service';
import { OwnerGuard } from 'src/shared/guards/owner.guard';
import { LeagueParams } from 'src/modules/leagues/params/LeagueParams';
import { Role } from 'src/modules/users/constants/users.constants';
import { User } from 'src/entities/user.entity';

export const LeagueRoleGuard = (roles: Role[]): Type<CanActivate> => {
  @Injectable()
  class RoleGuardMixin extends OwnerGuard implements CanActivate {
    constructor(protected usersService: UsersService, private leaguesService: LeaguesService) {
      super(usersService);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();

      const params: LeagueParams = request.params;
      if (!params.leagueId) {
        throw new HttpException('No league id', HttpStatus.BAD_REQUEST);
      }

      const leagueAdmins: User[] = await this.leaguesService.getLeagueAdmins(params.leagueId);
      const leagueReferees: User[] = await this.leaguesService.getLeagueReferees(params.leagueId);
      const leagueObservers: User[] = await this.leaguesService.getLeagueObservers(params.leagueId);

      for (const role of roles) {
        if (role === Role.Admin) {
          const isLeagueAdmin = leagueAdmins.some((admin) => admin.id === request.user.id);
          if (isLeagueAdmin) {
            return true;
          }
        }

        if (role === Role.Observer) {
          const isLeagueObserver = leagueObservers.some((observer) => observer.id === request.user.id);
          if (isLeagueObserver) {
            return true;
          }
        }

        if (role === Role.Referee) {
          const isLeagueReferee = leagueReferees.some((referee) => referee.id === request.user.id);
          if (isLeagueReferee) {
            return true;
          }
        }
      }

      return super.canActivate(context);
    }
  }

  return mixin(RoleGuardMixin);
};
