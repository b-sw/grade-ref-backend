import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LeaguesService } from 'src/modules/leagues/leagues.service';
import { CreateMatchDto } from 'src/modules/matches/dto/create-match.dto';
import { LeagueMatchParams } from 'src/modules/matches/params/LeagueMatchParams';
import { League } from 'src/entities/league.entity';
import { UsersService } from 'src/modules/users/users.service';
import { UpdateMatchDto } from 'src/modules/matches/dto/update-match.dto';
import { LeagueParams } from 'src/modules/leagues/params/LeagueParams';
import { User } from 'src/entities/user.entity';

@Injectable()
export class ValidRefereeObserverGuard implements CanActivate {
    constructor(private usersService: UsersService, private leaguesService: LeaguesService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const params: LeagueParams | LeagueMatchParams = request.params;
        const dto: CreateMatchDto | UpdateMatchDto = request.body;
        const leagueReferees: User[] = await this.leaguesService.getLeagueReferees(params.leagueId);
        const leagueObservers: User[] = await this.leaguesService.getLeagueObservers(params.leagueId);
        const referee: User | undefined = await this.usersService.getById(dto.refereeId);
        const observer: User | undefined = await this.usersService.getById(dto.observerId);
        const league: League | undefined = await this.leaguesService.getLeagueById(params.leagueId);

        if (!referee) {
            throw new HttpException('Invalid referee id ' + dto.refereeId, HttpStatus.BAD_REQUEST);
        }

        if (!observer) {
            throw new HttpException('Invalid observer id ' + dto.observerId, HttpStatus.BAD_REQUEST);
        }

        if (!league) {
            throw new HttpException('Invalid league id ' + params.leagueId, HttpStatus.BAD_REQUEST);
        }

        if (!leagueReferees.some((ref) => ref.id === referee.id)) {
            throw new HttpException(
                'Referee ' + referee.firstName + ' ' + referee.lastName + ' is not from league ' + league.name,
                HttpStatus.BAD_REQUEST,
            );
        }
        if (!leagueObservers.some((obs) => obs.id === observer.id)) {
            throw new HttpException(
                'Observer ' + observer.firstName + ' ' + observer.lastName + ' is not from league ' + league.name,
                HttpStatus.BAD_REQUEST,
            );
        }
        return true;
    }
}
