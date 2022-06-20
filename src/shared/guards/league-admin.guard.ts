import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { User } from '../../entities/user.entity';
import { LeaguesService } from '../../leagues/leagues.service';
import { LeagueParams } from '../../leagues/params/LeagueParams';
import { LeagueUserParams } from '../../leagues/params/LeagueUserParams';
import { LeagueTeamParams } from '../../teams/params/LeagueTeamParams';
import { OwnerGuard } from './owner.guard';

@Injectable()
export class LeagueAdminGuard extends OwnerGuard implements CanActivate {
  constructor(protected usersService: UsersService,
              protected leaguesService: LeaguesService) {
    super(usersService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.body !== {}) {
      console.log('request is', request.body);
    }
    const params: LeagueParams | LeagueUserParams | LeagueTeamParams = request.params;
    const leagueAdmins: User[] = await this.leaguesService.getLeagueAdmins(params.leagueId);

    if (leagueAdmins.some((admin) => admin.id === request.user.id)) {
      return true;
    }
    return super.canActivate(context);
  }
}
