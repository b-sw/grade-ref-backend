import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeagueParams } from '../leagues/params/LeagueParams';
import { LeagueTeamParams } from './params/LeagueTeamParams';
import { LeaguesService } from '../leagues/leagues.service';
import { League } from '../entities/league.entity';
import { OwnerGuard } from '../shared/guards/owner.guard';
import { LeagueAdminGuard } from '../shared/guards/league-admin.guard';

@ApiTags('teams')
@Controller('')
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService,
              private readonly leaguesService: LeaguesService) {}

  @Get('teams')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  async getAll() {
    return this.teamsService.getAll();
  }

  @Get('leagues/:leagueId/teams')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async getAllByLeagueId(@Param() params: LeagueParams) {
    const league: League = await this.leaguesService.getLeagueById(params.leagueId);
    return this.teamsService.getAllByLeagueId(league.id);
  }

  @Post('leagues/:leagueId/teams')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async create(@Param() params: LeagueParams, @Body() createTeamDto: CreateTeamDto) {
    const league: League = await this.leaguesService.getLeagueById(params.leagueId);
    return this.teamsService.create(league.id, createTeamDto);
  }

  @Put('leagues/:leagueId/teams/:teamId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async update(@Param() params: LeagueTeamParams, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(params, dto);
  }

  @Delete('leagues/:leagueId/teams/:teamId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async remove(@Param() params: LeagueTeamParams) {
    return this.teamsService.remove(params);
  }
}
