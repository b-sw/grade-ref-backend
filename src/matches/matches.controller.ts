import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserParams } from '../users/params/UserParams';
import { LeagueMatchParams } from './params/LeagueMatchParams';
import { LeagueParams } from '../leagues/params/LeagueParams';

@ApiTags('matches')
@Controller('')
@ApiBearerAuth()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('matches')
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.matchesService.getAll();
  }

  @Get('leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard)
  getById(@Param() params: LeagueParams) {
    return this.matchesService.getAllByLeagueId(params.leagueId);
  }

  @Post('leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard)
  create(@Param() params: LeagueParams, @Body() dto: CreateMatchDto) {
    return this.matchesService.create(params.leagueId, dto);
  }

  @Put('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard)
  update(@Param() params: LeagueMatchParams, @Body() dto: UpdateMatchDto) {
    return this.matchesService.update(params, dto);
  }

  @Delete('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard)
  remove(@Param() params: LeagueMatchParams) {
    return this.matchesService.remove(params);
  }

  @Get('users/:userId/matches')
  @UseGuards(JwtAuthGuard)
  getAssignedMatches(@Param() params: UserParams) {
    return this.matchesService.getUserMatches(params);
  }
}
