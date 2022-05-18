import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { User } from '../../entities/user.entity';
import { LeaguesService } from '../../leagues/leagues.service';
import { LeagueParams } from '../../leagues/params/LeagueParams';
import { LeagueMatchParams } from '../../matches/params/LeagueMatchParams';
import { CreateMatchDto } from '../../matches/dto/create-match.dto';
import { UpdateMatchDto } from '../../matches/dto/update-match.dto';
import { League } from '../../entities/league.entity';

@Injectable()
export class RefereeObserverGuard implements CanActivate {
  constructor(private usersService: UsersService,
              private leaguesService: LeaguesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params: LeagueParams | LeagueMatchParams = request.params;
    const dto: CreateMatchDto | UpdateMatchDto = request.body;
    const leagueReferees: User[] = await this.leaguesService.getLeagueReferees(params.leagueId);
    const leagueObservers: User[] = await this.leaguesService.getLeagueObservers(params.leagueId);
    const referee: User = await this.usersService.getById(dto.refereeId);
    const observer: User = await this.usersService.getById(dto.observerId);
    const league: League = await this.leaguesService.getLeagueById(params.leagueId);

    if (!leagueReferees.some((ref) => ref.id === referee.id)) {
      throw new HttpException('Referee ' + referee.firstName + ' ' + referee.lastName +
        ' is not from league ' + league.name, HttpStatus.BAD_REQUEST);
    }
    if (!leagueObservers.some((obs) => obs.id === observer.id)) {
      throw new HttpException('Observer ' + observer.firstName + ' ' + observer.lastName +
        ' is not from league ' + league.name, HttpStatus.BAD_REQUEST);
    }
    return true;
  }
}
