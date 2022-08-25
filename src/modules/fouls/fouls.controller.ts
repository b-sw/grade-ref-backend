import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Foul } from 'src/entities/foul.entity';
import { MatchRoleGuard } from 'src/shared/guards/matchRoleGuard';
import { LeagueMatchParams } from 'src/modules/matches/params/LeagueMatchParams';
import { MatchesService, OVERALL_GRADE_ENTRY_TIME_WINDOW } from 'src/modules/matches/matches.service';
import { UpdateFoulDto } from 'src/modules/fouls/dto/update-foul.dto';
import { FoulsService } from 'src/modules/fouls/fouls.service';
import { CreateFoulDto } from 'src/modules/fouls/dto/create-foul.dto';
import { Role } from 'src/modules/users/constants/users.constants';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { validateEntryTime } from 'src/shared/validators';
import { FoulParams } from 'src/modules/fouls/params/FoulParams';
import { uuid } from 'src/shared/types/uuid.type';
import { getNotNull } from 'src/shared/getters';

@ApiTags('fouls')
@Controller('')
@ApiBearerAuth()
export class FoulsController {
  constructor(private readonly foulsService: FoulsService, private readonly matchesService: MatchesService) {}

  @Post('leagues/:leagueId/matches/:matchId/fouls')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Create foul' })
  async create(@Param() params: LeagueMatchParams, @Body() createFoulDto: CreateFoulDto): Promise<Foul> {
    await this.validateFoulEntryTime(params.matchId);
    return await this.foulsService.create(createFoulDto, params.matchId);
  }

  @Get('leagues/:leagueId/matches/:matchId/fouls')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Referee, Role.Observer, Role.Admin]))
  @ApiOperation({ summary: 'Get match fouls' })
  async getMatchFouls(@Param() params: LeagueMatchParams): Promise<Foul[]> {
    return await this.foulsService.getByMatch(params.matchId);
  }

  @Get('leagues/:leagueId/matches/:matchId/fouls/:foulId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Referee, Role.Observer, Role.Admin]))
  @ApiOperation({ summary: 'Get foul by id' })
  async getById(@Param() params: FoulParams): Promise<Foul> {
    return await this.foulsService.getById(params.foulId);
  }

  @Put('leagues/:leagueId/matches/:matchId/fouls/:foulId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Update foul' })
  async update(@Param() params: FoulParams, @Body() updateFoulDto: UpdateFoulDto): Promise<Foul> {
    await this.validateFoulEntryTime(params.matchId);
    return await this.foulsService.update(params.foulId, updateFoulDto);
  }

  @Delete('leagues/:leagueId/matches/:matchId/fouls/:foulId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Delete foul' })
  async remove(@Param() params: FoulParams): Promise<Foul> {
    return await this.foulsService.remove(params.foulId);
  }

  async validateFoulEntryTime(matchId: uuid): Promise<void> {
    const match = getNotNull(await this.matchesService.getById(matchId));
    if (match.overallGrade) {
      validateEntryTime(match.matchDate, OVERALL_GRADE_ENTRY_TIME_WINDOW);
    }
  }
}
