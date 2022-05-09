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

@ApiTags('teams')
@Controller('')
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService,
              private readonly leaguesService: LeaguesService) {}

  @Get('teams')
  @UseGuards(JwtAuthGuard)
  async getAll() {
    return this.teamsService.getAll();
  }

  @Get('leagues/:leagueId/teams')
  @UseGuards(JwtAuthGuard)
  async getAllByLeagueId(@Param() params: LeagueParams) {
    const league: League = await this.leaguesService.getById(params);
    return this.teamsService.getAllByLeagueId(league.id);
  }

  @Post('leagues/:leagueId/teams')
  @UseGuards(JwtAuthGuard)
  async create(@Param() params: LeagueParams, @Body() createTeamDto: CreateTeamDto) {
    const league: League = await this.leaguesService.getById(params);
    return this.teamsService.create(league.id, createTeamDto);
  }

  @Put('leagues/:leagueId/teams/:teamId')
  @UseGuards(JwtAuthGuard)
  async update(@Param() params: LeagueTeamParams, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(params, dto);
  }

  @Delete('leagues/:leagueId/teams/:teamId')
  @UseGuards(JwtAuthGuard)
  async remove(@Param() params: LeagueTeamParams) {
    return this.teamsService.remove(params);
  }
}
