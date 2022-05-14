import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserParams } from '../users/params/UserParams';
import { LeagueMatchParams } from './params/LeagueMatchParams';
import { LeagueParams } from '../leagues/params/LeagueParams';
import { Match } from '../entities/match.entity';
import { OwnerGuard } from '../shared/guards/owner.guard';
import { LeagueAdminGuard } from '../shared/guards/league-admin.guard';
import { SelfGuard } from '../shared/guards/self.guard';

@ApiTags('matches')
@Controller('')
@ApiBearerAuth()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('matches')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  async getAllMatches(): Promise<Match[]> {
    return this.matchesService.getAllMatches();
  }

  @Get('leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async getByLeague(@Param() params: LeagueParams): Promise<Match[]> {
    return this.matchesService.getByLeague(params.leagueId);
  }

  @Post('leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async createMatch(@Param() params: LeagueParams, @Body() dto: CreateMatchDto): Promise<Match> {
    return this.matchesService.createMatch(params.leagueId, dto);
  }

  @Put('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async updateMatch(@Param() params: LeagueMatchParams, @Body() dto: UpdateMatchDto): Promise<Match> {
    return this.matchesService.updateMatch(params, dto);
  }

  @Put('leagues/:leagueId/matches/:matchId/grade')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async updateMatchGrade(@Param() params: LeagueMatchParams, @Body() dto: UpdateMatchDto): Promise<Match> {
    return this.matchesService.updateGrade(params, dto);
  }

  @Delete('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async removeMatch(@Param() params: LeagueMatchParams): Promise<Match> {
    return this.matchesService.removeMatch(params);
  }

  @Get('users/:userId/matches')
  @UseGuards(JwtAuthGuard, SelfGuard)
  async getUserMatches(@Param() params: UserParams): Promise<Match[]> {
    return this.matchesService.getUserMatches(params);
  }
}
