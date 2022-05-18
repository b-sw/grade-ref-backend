import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserParams } from '../users/params/UserParams';
import { LeagueMatchParams } from './params/LeagueMatchParams';
import { LeagueParams } from '../leagues/params/LeagueParams';
import { Match } from '../entities/match.entity';
import { OwnerGuard } from '../shared/guards/owner.guard';
import { LeagueAdminGuard } from '../shared/guards/league-admin.guard';
import { SelfGuard } from '../shared/guards/self.guard';
import { LeaguesService } from '../leagues/leagues.service';
import { TeamsService } from '../teams/teams.service';
import { League } from '../entities/league.entity';
import { Team } from '../entities/team.entity';
import { uuid } from '../shared/types/uuid';
import { RefereeObserverGuard } from '../shared/guards/referee-observer-guard.service';
import { ObserverGuard } from '../shared/guards/observer.guard';
import { LeagueUserParams } from '../leagues/params/LeagueUserParams';

@ApiTags('matches')
@Controller('')
@ApiBearerAuth()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService,
              private readonly leaguesService: LeaguesService,
              private readonly teamsService: TeamsService) {}

  @Get('matches')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({ summary: 'Get all matches' })
  async getAllMatches(): Promise<Match[]> {
    return this.matchesService.getAllMatches();
  }

  @Get('leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  @ApiOperation({ summary: 'Get all matches in a league' })
  async getByLeague(@Param() params: LeagueParams): Promise<Match[]> {
    return this.matchesService.getByLeague(params.leagueId);
  }

  @Post('leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard, RefereeObserverGuard)
  @ApiOperation({ summary: 'Create match' })
  async createMatch(@Param() params: LeagueParams, @Body() dto: CreateMatchDto): Promise<Match> {
    const { leagueIdx, homeTeamIdx } = await this.getUserReadableKeyParams(dto.homeTeamId);
    return this.matchesService.createMatch(params.leagueId, dto, leagueIdx, homeTeamIdx);
  }

  @Put('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard, RefereeObserverGuard)
  @ApiOperation({ summary: 'Update match' })
  async updateMatch(@Param() params: LeagueMatchParams, @Body() dto: UpdateMatchDto): Promise<Match> {
    const { leagueIdx, homeTeamIdx } = await this.getUserReadableKeyParams(dto.homeTeamId);
    return this.matchesService.updateMatch(params, dto, leagueIdx, homeTeamIdx);
  }

  @Put('leagues/:leagueId/matches/:matchId/grade')
  @UseGuards(JwtAuthGuard, ObserverGuard)
  @ApiOperation({ summary: 'Update referee match grade' })
  async updateMatchGrade(@Param() params: LeagueMatchParams, @Body() dto: UpdateMatchDto): Promise<Match> {
    return this.matchesService.updateGrade(params, dto);
  }

  @Delete('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  @ApiOperation({ summary: 'Delete match' })
  async removeMatch(@Param() params: LeagueMatchParams): Promise<Match> {
    return this.matchesService.removeMatch(params);
  }

  @Get('users/:userId/matches')
  @UseGuards(JwtAuthGuard, SelfGuard)
  @ApiOperation({ summary: 'Get user matches' })
  async getUserMatches(@Param() params: UserParams): Promise<Match[]> {
    return this.matchesService.getUserMatches(params);
  }

  @Get('users/:userId/leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  @ApiOperation({ summary: 'Get user league matches' })
  async getUserLeagueMatches(@Param() params: LeagueUserParams): Promise<Match[]> {
    return this.matchesService.getUserLeagueMatches(params);
  }

  async getUserReadableKeyParams(homeTeamId: uuid): Promise<{ leagueIdx: number, homeTeamIdx: number }> {
    const homeTeam: Team = await this.teamsService.getById(homeTeamId);
    const leagues: League[] = await this.leaguesService.getLeagues();
    const league: League = await this.leaguesService.getLeagueById(homeTeam.leagueId);
    const teams: Team[] = await this.teamsService.getAllByLeagueId(league.id);

    leagues.sort((a, b) => a.name.localeCompare(b.name));
    teams.sort((a, b) => a.name.localeCompare(b.name));

    const leagueIdx: number = leagues.indexOf(league)
    const homeTeamIdx: number = teams.indexOf(homeTeam);

    return { leagueIdx, homeTeamIdx }
  }
}
