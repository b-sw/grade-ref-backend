import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { LeagueAdminGuard } from './league-admin.guard';
import { UsersService } from '../../users/users.service';
import { LeaguesService } from '../../leagues/leagues.service';
import { LeagueParams } from '../../leagues/params/LeagueParams';

@Injectable()
export class LeagueUserGuard extends LeagueAdminGuard implements CanActivate {
  constructor(protected usersService: UsersService,
              protected leaguesService: LeaguesService) {
    super(usersService, leaguesService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params: LeagueParams = request.params;
    const user = await this.usersService.getById(request.user.id);
    const league = await this.leaguesService.getLeagueById(params.leagueId);

    if (league.observers.some((observer) => observer.id === user.id)) {
      return true;
    }
    if (league.referees.some((referee) => referee.id === user.id)) {
      return true;
    }
    return super.canActivate(context);
  }
}
