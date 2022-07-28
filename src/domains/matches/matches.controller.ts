import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeagueMatchParams } from './params/LeagueMatchParams';
import { LeagueParams } from '../leagues/params/LeagueParams';
import { Match } from '../../entities/match.entity';
import { OwnerGuard } from '../../shared/guards/owner.guard';
import { LeaguesService } from '../leagues/leagues.service';
import { TeamsService } from '../teams/teams.service';
import { League } from '../../entities/league.entity';
import { Team } from '../../entities/team.entity';
import { uuid } from '../../shared/constants/uuid.constant';
import { ValidRefereeObserverGuard } from '../../shared/guards/valid-referee-observer-guard.service';
import { LeagueUserParams } from '../leagues/params/LeagueUserParams';
import { UsersService } from '../users/users.service';
import { User } from '../../entities/user.entity';
import { MatchGradeGuard } from '../../shared/guards/match-grade.guard';
import { GradeMessage } from './dto/update-grade-sms.dto';
import { getNotNull } from '../../shared/getters';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../aws/s3.service';
import { LeagueMatchReportParams } from './params/LeagueMatchReportParams';
import dayjs from 'dayjs';
import { ActionType, Role } from '../users/constants/users.constants';
import { S3Bucket, S3FileKeyDateFormat } from '../aws/constants/aws.constants';
import { MatchRoleGuard } from '../../shared/guards/matchRoleGuard';
import { MatchInfo } from './types/match-info.type';
import { LeagueRoleGuard } from '../../shared/guards/league-role.guard';

@ApiTags('matches')
@Controller('')
@ApiBearerAuth()
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly leaguesService: LeaguesService,
    private readonly teamsService: TeamsService,
    private readonly usersService: UsersService,
    private readonly s3Service: S3Service,
  ) {}

  @Get('matches')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({ summary: 'Get all matches' })
  async getAllMatches(): Promise<Match[]> {
    return this.matchesService.getAllMatches();
  }

  @Get('leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
  @ApiOperation({ summary: 'Get all matches in a league' })
  async getByLeague(@Param() params: LeagueParams): Promise<Match[]> {
    return this.matchesService.getByLeague(params.leagueId);
  }

  @Post('leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]), ValidRefereeObserverGuard)
  @ApiOperation({ summary: 'Create match' })
  async createMatch(@Param() params: LeagueParams, @Body() dto: CreateMatchDto): Promise<Match> {
    const { leagueIdx, homeTeamIdx } = await this.getUserReadableKeyParams(dto.homeTeamId);
    const observer: User = getNotNull(await this.usersService.getById(dto.observerId));
    return this.matchesService.createMatch(params.leagueId, dto, leagueIdx, homeTeamIdx, observer.phoneNumber);
  }

  @Get('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin, Role.Referee, Role.Observer]))
  @ApiOperation({ summary: 'Get league match by id' })
  async getMatch(@Request() req, @Param() params: LeagueMatchParams): Promise<MatchInfo> {
    const user = getNotNull(await this.usersService.getById(req.user.id));
    const userIsReferee = user.role === Role.Referee;
    const match = getNotNull(await this.matchesService.getById(params.matchId));
    const { referees, observers } = await this.getLeagueDataDictionaries(match.leagueId);
    return this.getMatchInfo(match, referees, observers, userIsReferee);
  }

  @Get('leagues/:leagueId/matches/:matchId/details')
  @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
  @ApiOperation({ summary: 'Get league match details' })
  async getMatchDetails(@Param() params: LeagueMatchParams): Promise<Match> {
    return getNotNull(this.matchesService.getById(params.matchId));
  }

  @Put('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin]), ValidRefereeObserverGuard)
  @ApiOperation({ summary: 'Update match' })
  async updateMatch(@Param() params: LeagueMatchParams, @Body() dto: UpdateMatchDto): Promise<Match> {
    const { leagueIdx, homeTeamIdx } = await this.getUserReadableKeyParams(dto.homeTeamId);
    const observer: User = getNotNull(await this.usersService.getById(dto.observerId));
    return this.matchesService.updateMatch(params, dto, leagueIdx, homeTeamIdx, observer.phoneNumber);
  }

  @Put('leagues/:leagueId/matches/:matchId/grade')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin, Role.Observer]))
  @ApiOperation({ summary: 'Update referee match grade' })
  async updateMatchGrade(@Param() params: LeagueMatchParams, @Body() dto: Partial<UpdateMatchDto>): Promise<MatchInfo> {
    const match = await this.matchesService.updateGrade(params, dto);
    const { referees, observers } = await this.getLeagueDataDictionaries(match.leagueId);
    return this.getMatchInfo(match, referees, observers);
  }

  @Put('leagues/:leagueId/matches/:matchId/overallGrade')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin, Role.Observer]))
  @ApiOperation({ summary: 'Update referee overall grade' })
  async updateMatchOverallGrade(
    @Param() params: LeagueMatchParams,
    @Body() dto: Partial<UpdateMatchDto>,
  ): Promise<MatchInfo> {
    const match = await this.matchesService.updateOverallGrade(params, dto);
    const { referees, observers } = await this.getLeagueDataDictionaries(match.leagueId);
    return this.getMatchInfo(match, referees, observers);
  }

  @Put('leagues/:leagueId/matches/:matchId/refereeNote')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Referee]))
  @ApiOperation({ summary: 'Update referee note' })
  async updateMatchRefereeNote(
    @Param() params: LeagueMatchParams,
    @Body() dto: Partial<UpdateMatchDto>,
  ): Promise<MatchInfo> {
    const match = await this.matchesService.updateRefereeNote(params, dto);
    const { referees, observers } = await this.getLeagueDataDictionaries(match.leagueId);
    return this.getMatchInfo(match, referees, observers, true);
  }

  @Post('matches/grades')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MatchGradeGuard)
  @ApiOperation({ summary: 'Update referee match grade by sms' })
  async updateMatchGradeSms(@Request() req): Promise<void> {
    Logger.log(req.body, 'Update match grade sms');
    const message: GradeMessage = JSON.parse(req.body.message);
    const observer: User = getNotNull(await this.usersService.getByPhoneNumber(message.msisdn));
    return this.matchesService.updateGradeSms(message, observer);
  }

  @Delete('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin]))
  @ApiOperation({ summary: 'Delete match' })
  async removeMatch(@Param() params: LeagueMatchParams): Promise<Match> {
    const match: Match = getNotNull(await this.matchesService.getById(params.matchId));
    const observer: User = getNotNull(await this.usersService.getById(match.observerId));
    return this.matchesService.removeMatch(params, observer.phoneNumber);
  }

  @Get('users/:userId/leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin, Role.Referee, Role.Observer]))
  @ApiOperation({ summary: 'Get user league matches' })
  async getUserLeagueMatches(@Request() req, @Param() params: LeagueUserParams): Promise<MatchInfo[]> {
    const user = getNotNull(await this.usersService.getById(req.user.id));
    const userIsReferee = user.role === Role.Referee;
    const matches = await this.matchesService.getUserLeagueMatches(params);

    const { referees, observers } = await this.getLeagueDataDictionaries(params.leagueId);
    return matches.map((match) => this.getMatchInfo(match, referees, observers, userIsReferee));
  }

  async getUserReadableKeyParams(homeTeamId: uuid): Promise<{ leagueIdx: number; homeTeamIdx: number }> {
    const homeTeam: Team = await this.teamsService.getById(homeTeamId);
    const leagues: League[] = await this.leaguesService.getLeagues();
    const teamLeague: League = await this.leaguesService.getLeagueById(homeTeam.leagueId);
    const teams: Team[] = await this.teamsService.getAllByLeagueId(teamLeague.id);

    leagues.sort((a, b) => a.name.localeCompare(b.name));
    teams.sort((a, b) => a.name.localeCompare(b.name));

    const leagueIdx: number = leagues.findIndex((league) => league.id === league.id);
    const homeTeamIdx: number = teams.findIndex((team) => team.id === homeTeam.id);

    return { leagueIdx, homeTeamIdx };
  }

  @Post('leagues/:leagueId/matches/upload/validate')
  @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
  @UseInterceptors(FileInterceptor('matches'))
  @ApiOperation({ summary: 'Validate file' })
  async validateUpload(@Param() params: LeagueParams, @UploadedFile() file): Promise<CreateMatchDto[]> {
    const teams: Team[] = await this.teamsService.getAllByLeagueId(params.leagueId);
    const referees: User[] = await this.leaguesService.getLeagueReferees(params.leagueId);
    const observers: User[] = await this.leaguesService.getLeagueObservers(params.leagueId);

    const { buffer } = file;
    await this.matchesService.validateMatches(buffer.toString(), params.leagueId, teams, referees, observers);
    const dtos: CreateMatchDto[] = await this.matchesService.getFileMatchesDtos(
      buffer.toString(),
      params.leagueId,
      teams,
      referees,
      observers,
    );

    await Promise.all(
      dtos.map(async (dto) => {
        await this.matchesService.validateMatch(dto);
      }),
    );

    return dtos;
  }

  @Post('leagues/:leagueId/matches/upload')
  @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
  @UseInterceptors(FileInterceptor('matches'))
  @ApiOperation({ summary: 'Upload file' })
  async createMatches(@Param() params: LeagueParams, @UploadedFile() file): Promise<Match[]> {
    const dtos: CreateMatchDto[] = await this.validateUpload(params, file);

    const matches: Match[] = [];
    await Promise.all(
      dtos.map(async (dto: CreateMatchDto) => {
        const match: Match = await this.createMatch(params, dto);
        matches.push(match);
      }),
    );

    const { originalname } = file;
    const key = String(originalname + ' ' + dayjs().toString());
    await this.s3Service.upload(S3Bucket.MatchesBucket, key, file);

    return matches;
  }

  @Post('leagues/:leagueId/matches/:matchId/reports/:reportType')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin, Role.Referee, Role.Observer]))
  @UseInterceptors(FileInterceptor('report'))
  @ApiOperation({ summary: 'Upload report' })
  async uploadReport(
    @Request() request,
    @Param() params: LeagueMatchReportParams,
    @UploadedFile() file,
  ): Promise<MatchInfo> {
    const user = getNotNull(await this.usersService.getById(request.user.id));
    let match = getNotNull(await this.matchesService.getById(params.matchId));
    this.matchesService.validateMatchNotUpcoming(match);
    this.matchesService.validateUserAction(user, params.reportType, ActionType.Write);

    const formattedDate = dayjs().format(S3FileKeyDateFormat);
    const key = `league=${params.leagueId}/match=${params.matchId}/report=${params.reportType}/${params.reportType} ${formattedDate}.pdf`;

    await this.s3Service.upload(S3Bucket.ReportsBucket, key, file);
    match = await this.matchesService.updateReportData(params.matchId, params.reportType, key);
    const { referees, observers } = await this.getLeagueDataDictionaries(match.leagueId);
    return this.getMatchInfo(match, referees, observers, user.role === Role.Referee);
  }

  @Get('leagues/:leagueId/matches/:matchId/reports/:reportType')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin, Role.Referee, Role.Observer]))
  @ApiOperation({ summary: 'Download report' })
  async getReport(@Request() request, @Param() params: LeagueMatchReportParams): Promise<string> {
    const user = getNotNull(await this.usersService.getById(request.user.id));
    const match = getNotNull(await this.matchesService.getById(params.matchId));
    this.matchesService.validateMatchNotUpcoming(match);
    this.matchesService.validateUserAction(user, params.reportType, ActionType.Read);

    const key = await this.matchesService.getKeyForReport(params.matchId, params.reportType);
    return this.s3Service.getPresignedUrl(S3Bucket.ReportsBucket, key);
  }

  @Delete('leagues/:leagueId/matches/:matchId/reports/:reportType')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin, Role.Referee, Role.Observer]))
  @ApiOperation({ summary: 'Delete report' })
  async removeReport(@Request() request, @Param() params: LeagueMatchReportParams): Promise<MatchInfo> {
    const user = getNotNull(await this.usersService.getById(request.user.id));
    let match = getNotNull(await this.matchesService.getById(params.matchId));
    this.matchesService.validateMatchNotUpcoming(match);
    this.matchesService.validateUserAction(user, params.reportType, ActionType.Write);

    match = await this.matchesService.removeReport(params.matchId, params.reportType);
    const { referees, observers } = await this.getLeagueDataDictionaries(match.leagueId);
    return this.getMatchInfo(match, referees, observers, user.role === Role.Referee);
  }

  private async getLeagueReferees(leagueId: uuid): Promise<{ [key: uuid]: User }> {
    const referees: User[] = await this.leaguesService.getLeagueReferees(leagueId);
    return Object.assign({}, ...referees.map((referee) => ({ [referee.id]: referee })));
  }

  private async getLeagueObservers(leagueId: uuid): Promise<{ [key: uuid]: User }> {
    const observers: User[] = await this.leaguesService.getLeagueObservers(leagueId);
    return Object.assign({}, ...observers.map((observer) => ({ [observer.id]: observer })));
  }

  private async getLeagueDataDictionaries(
    leagueId: uuid,
  ): Promise<{ referees: { [key: uuid]: User }; observers: { [key: uuid]: User } }> {
    const referees: { [key: uuid]: User } = await this.getLeagueReferees(leagueId);
    const observers: { [key: uuid]: User } = await this.getLeagueObservers(leagueId);
    return { referees, observers };
  }

  private getMatchInfo(
    match: Match,
    referees: { [key: uuid]: User },
    observers: { [key: uuid]: User },
    hideObserver = false,
  ): MatchInfo {
    return this.matchesService.getMatchInfo(match, referees, observers, hideObserver);
  }
}
