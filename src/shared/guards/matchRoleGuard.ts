import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, mixin, Type } from '@nestjs/common';
import { LeaguesService } from 'src/modules/leagues/leagues.service';
import { LeagueMatchParams } from 'src/modules/matches/params/LeagueMatchParams';
import { UsersService } from 'src/modules/users/users.service';
import { OwnerGuard } from 'src/shared/guards/owner.guard';
import { MatchesService } from 'src/modules/matches/matches.service';
import { Role } from 'src/modules/users/constants/users.constants';
import { Match } from 'src/entities/match.entity';
import { User } from 'src/entities/user.entity';

export const MatchRoleGuard = (roles: Role[]): Type<CanActivate> => {
    @Injectable()
    class RoleGuardMixin extends OwnerGuard implements CanActivate {
        constructor(
            protected usersService: UsersService,
            private matchesService: MatchesService,
            private leaguesService: LeaguesService,
        ) {
            super(usersService);
        }

        async canActivate(context: ExecutionContext): Promise<boolean> {
            const request = context.switchToHttp().getRequest();

            const params: LeagueMatchParams = request.params;

            if (!params.leagueId) {
                throw new HttpException('No league id', HttpStatus.BAD_REQUEST);
            }

            if (!params.matchId) {
                throw new HttpException('No match id ' + params.matchId, HttpStatus.BAD_REQUEST);
            }

            const match: Match | undefined = await this.matchesService.getById(params.matchId);
            if (!match) {
                throw new HttpException('Invalid match id ' + params.matchId, HttpStatus.BAD_REQUEST);
            }

            const leagueAdmins: User[] = await this.leaguesService.getLeagueAdmins(params.leagueId);

            for (const role of roles) {
                if (role === Role.Admin) {
                    const isLeagueAdmin = leagueAdmins.some((admin) => admin.id === request.user.id);
                    if (isLeagueAdmin) {
                        return true;
                    }
                }

                if (role === Role.Observer) {
                    if (request.user.id === match.observerId) {
                        return true;
                    }
                }

                if (role === Role.Referee) {
                    if (request.user.id === match.refereeId) {
                        return true;
                    }
                }
            }

            return super.canActivate(context);
        }
    }

    return mixin(RoleGuardMixin);
};
