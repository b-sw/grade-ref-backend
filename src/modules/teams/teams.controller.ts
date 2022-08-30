import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeamsService } from 'src/modules/teams/teams.service';
import { LeaguesService } from 'src/modules/leagues/leagues.service';
import { Role } from 'src/modules/users/constants/users.constants';
import { League } from 'src/entities/league.entity';
import { UpdateTeamDto } from 'src/modules/teams/dto/update-team.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { OwnerGuard } from 'src/shared/guards/owner.guard';
import { LeagueParams } from 'src/modules/leagues/params/LeagueParams';
import { Team } from 'src/entities/team.entity';
import { LeagueRoleGuard } from 'src/shared/guards/league-role.guard';
import { CreateTeamDto } from 'src/modules/teams/dto/create-team.dto';
import { LeagueTeamParams } from 'src/modules/teams/params/LeagueTeamParams';

@ApiTags('teams')
@Controller('')
@ApiBearerAuth()
export class TeamsController {
    constructor(private readonly teamsService: TeamsService, private readonly leaguesService: LeaguesService) {}

    @Get('teams')
    @UseGuards(JwtAuthGuard, OwnerGuard)
    @ApiOperation({ summary: 'Get all teams' })
    async getAll(): Promise<Team[]> {
        return this.teamsService.getAll();
    }

    @Get('leagues/:leagueId/teams')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin, Role.Referee, Role.Observer]))
    @ApiOperation({ summary: 'Get all teams in a league' })
    async getAllByLeagueId(@Param() params: LeagueParams): Promise<Team[]> {
        const league: League = await this.leaguesService.getLeagueById(params.leagueId);
        return this.teamsService.getAllByLeagueId(league.id);
    }

    @Post('leagues/:leagueId/teams')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
    @ApiOperation({ summary: 'Create team' })
    async create(@Param() params: LeagueParams, @Body() createTeamDto: CreateTeamDto): Promise<Team> {
        const league: League = await this.leaguesService.getLeagueById(params.leagueId);
        return this.teamsService.create(league.id, createTeamDto);
    }

    @Put('leagues/:leagueId/teams/:teamId')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
    @ApiOperation({ summary: 'Update team' })
    async update(@Param() params: LeagueTeamParams, @Body() dto: UpdateTeamDto): Promise<Team> {
        return this.teamsService.update(params, dto);
    }

    @Delete('leagues/:leagueId/teams/:teamId')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
    @ApiOperation({ summary: 'Delete team' })
    async remove(@Param() params: LeagueTeamParams) {
        return this.teamsService.remove(params);
    }
}
