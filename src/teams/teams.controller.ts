import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeagueParams } from '../leagues/params/LeagueParams';
import { LeagueTeamParams } from './params/LeagueTeamParams';
import { LeaguesService } from '../leagues/leagues.service';
import { League } from '../entities/league.entity';
import { OwnerGuard } from '../shared/guards/owner.guard';
import { MatchRoleGuard } from '../shared/guards/matchRoleGuard';
import { Role } from '../users/constants/users.constants';
import { Team } from '../entities/team.entity';

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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all teams in a league' })
  async getAllByLeagueId(@Param() params: LeagueParams): Promise<Team[]> {
    const league: League = await this.leaguesService.getLeagueById(params.leagueId);
    return this.teamsService.getAllByLeagueId(league.id);
  }

  @Post('leagues/:leagueId/teams')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin]))
  @ApiOperation({ summary: 'Create team' })
  async create(@Param() params: LeagueParams, @Body() createTeamDto: CreateTeamDto): Promise<Team> {
    const league: League = await this.leaguesService.getLeagueById(params.leagueId);
    return this.teamsService.create(league.id, createTeamDto);
  }

  @Put('leagues/:leagueId/teams/:teamId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin]))
  @ApiOperation({ summary: 'Update team' })
  async update(@Param() params: LeagueTeamParams, @Body() dto: UpdateTeamDto): Promise<Team> {
    return this.teamsService.update(params, dto);
  }

  @Delete('leagues/:leagueId/teams/:teamId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin]))
  @ApiOperation({ summary: 'Delete team' })
  async remove(@Param() params: LeagueTeamParams) {
    return this.teamsService.remove(params);
  }
}
