import { Controller, Get, Post, Body, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { FoulsService } from './fouls.service';
import { CreateFoulDto } from './dto/create-foul.dto';
import { UpdateFoulDto } from './dto/update-foul.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeagueMatchParams } from '../matches/params/LeagueMatchParams';
import { FoulParams } from './params/FoulParams';
import { MatchesService, OVERALL_GRADE_ENTRY_TIME_WINDOW } from '../matches/matches.service';
import { validateEntryTime } from '../shared/validators';
import { Match } from '../entities/match.entity';
import { uuid } from '../shared/constants/uuid.constant';
import { Foul } from '../entities/foul.entity';
import { Role } from '../users/constants/users.constants';
import { MatchRoleGuard } from '../shared/guards/matchRoleGuard';

@ApiTags('fouls')
@Controller('')
@ApiBearerAuth()
export class FoulsController {
  constructor(private readonly foulsService: FoulsService,
              private readonly matchesService: MatchesService) {}

  @Post('leagues/:leagueId/matches/:matchId/fouls')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Create foul' })
  async create(@Param() params: LeagueMatchParams, @Body() createFoulDto: CreateFoulDto): Promise<FoulInfo> {
    await this.validateFoulEntryTime(params.matchId);
    return await this.foulsService.create(createFoulDto, params.matchId);
  }

  @Get('leagues/:leagueId/matches/:matchId/fouls')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Referee, Role.Observer, Role.Admin]))
  @ApiOperation({ summary: 'Get match fouls' })
  async getMatchFouls(@Param() params: LeagueMatchParams): Promise<FoulInfo[]> {
    return await this.foulsService.getByMatch(params.matchId);
  }

  @Get('leagues/:leagueId/matches/:matchId/fouls/:foulId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Referee, Role.Observer, Role.Admin]))
  @ApiOperation({ summary: 'Get foul by id' })
  async getById(@Param() params: FoulParams): Promise<FoulInfo> {
    return await this.foulsService.getById(params.foulId);
  }

  @Put('leagues/:leagueId/matches/:matchId/fouls/:foulId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Update foul' })
  async update(@Param() params: FoulParams, @Body() updateFoulDto: UpdateFoulDto): Promise<FoulInfo> {
    await this.validateFoulEntryTime(params.matchId);
    return await this.foulsService.update(params.foulId, updateFoulDto);
  }

  @Delete('leagues/:leagueId/matches/:matchId/fouls/:foulId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Delete foul' })
  async remove(@Param() params: FoulParams): Promise<FoulInfo> {
    return await this.foulsService.remove(params.foulId);
  }

  async validateFoulEntryTime(matchId: uuid): Promise<void> {
    const match: Match = await this.matchesService.getById(matchId);
    if (match.overallGrade) {
      validateEntryTime(match.matchDate, OVERALL_GRADE_ENTRY_TIME_WINDOW);
    }
  }
}
