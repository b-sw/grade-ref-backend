import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
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
import { uuid } from '../shared/constants/uuid.constant';
import { ValidRefereeObserverGuard } from '../shared/guards/valid-referee-observer-guard.service';
import { LeagueUserParams } from '../leagues/params/LeagueUserParams';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';
import { MatchGradeGuard } from '../shared/guards/match-grade.guard';
import { GradeMessage } from './dto/update-grade-sms.dto';
import { getNotNull } from '../shared/getters';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoleGuard } from '../shared/guards/role.guard';
import { S3Service } from '../aws/s3.service';
import { LeagueMatchReportParams } from './params/LeagueMatchReportParams';
import dayjs from 'dayjs';
import { LeagueUserGuard } from '../shared/guards/league-user.guard';
import { ActionType, Role } from '../users/constants/users.constants';
import { S3Bucket, S3FileKeyDateFormat } from '../aws/constants/aws.constants';
import { RoleOrGuard } from '../shared/guards/role-or.guard';

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
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  @ApiOperation({ summary: 'Get all matches in a league' })
  async getByLeague(@Param() params: LeagueParams): Promise<Match[]> {
    return this.matchesService.getByLeague(params.leagueId);
  }

  @Post('leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard, ValidRefereeObserverGuard)
  @ApiOperation({ summary: 'Create match' })
  async createMatch(@Param() params: LeagueParams, @Body() dto: CreateMatchDto): Promise<Match> {
    const { leagueIdx, homeTeamIdx } = await this.getUserReadableKeyParams(dto.homeTeamId);
    const observer: User = getNotNull(await this.usersService.getById(dto.observerId));
    return this.matchesService.createMatch(params.leagueId, dto, leagueIdx, homeTeamIdx, observer.phoneNumber);
  }

  @Get('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard, RoleOrGuard([Role.Admin, Role.Referee, Role.Observer]))
  @ApiOperation({ summary: 'Get match by id' })
  async getMatch(@Param() params: LeagueMatchParams): Promise<Match> {
    return getNotNull(await this.matchesService.getById(params.matchId));
  }

  @Put('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard, ValidRefereeObserverGuard)
  @ApiOperation({ summary: 'Update match' })
  async updateMatch(@Param() params: LeagueMatchParams, @Body() dto: UpdateMatchDto): Promise<Match> {
    const { leagueIdx, homeTeamIdx } = await this.getUserReadableKeyParams(dto.homeTeamId);
    const observer: User = getNotNull(await this.usersService.getById(dto.observerId));
    return this.matchesService.updateMatch(params, dto, leagueIdx, homeTeamIdx, observer.phoneNumber);
  }

  @Put('leagues/:leagueId/matches/:matchId/grade')
  @UseGuards(JwtAuthGuard, RoleGuard(Role.Observer))
  @ApiOperation({ summary: 'Update referee match grade' })
  async updateMatchGrade(@Param() params: LeagueMatchParams, @Body() dto: Partial<UpdateMatchDto>): Promise<Match> {
    return this.matchesService.updateGrade(params, dto);
  }

  @Put('leagues/:leagueId/matches/:matchId/overallGrade')
  @UseGuards(JwtAuthGuard, RoleOrGuard([Role.Admin, Role.Observer]))
  @ApiOperation({ summary: 'Update referee overall grade' })
  async updateMatchOverallGrade(
    @Param() params: LeagueMatchParams,
    @Body() dto: Partial<UpdateMatchDto>,
  ): Promise<Match> {
    return this.matchesService.updateOverallGrade(params, dto);
  }

  @Put('leagues/:leagueId/matches/:matchId/refereeNote')
  @UseGuards(JwtAuthGuard, RoleGuard(Role.Referee))
  @ApiOperation({ summary: 'Update referee note' })
  async updateMatchRefereeNote(
    @Param() params: LeagueMatchParams,
    @Body() dto: Partial<UpdateMatchDto>,
  ): Promise<Match> {
    return this.matchesService.updateRefereeNote(params, dto);
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
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  @ApiOperation({ summary: 'Delete match' })
  async removeMatch(@Param() params: LeagueMatchParams): Promise<Match> {
    const match: Match = getNotNull(await this.matchesService.getById(params.matchId));
    const observer: User = getNotNull(await this.usersService.getById(match.observerId));
    return this.matchesService.removeMatch(params, observer.phoneNumber);
  }

  @Get('users/:userId/matches')
  @UseGuards(JwtAuthGuard, SelfGuard)
  @ApiOperation({ summary: 'Get user matches' })
  async getUserMatches(@Param() params: UserParams): Promise<Match[]> {
    return this.matchesService.getUserMatches(params);
  }

  @Get('users/:userId/leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user league matches' })
  async getUserLeagueMatches(@Request() req, @Param() params: LeagueUserParams): Promise<Match[]> {
    const user: User = getNotNull(await this.usersService.getById(req.user.id));
    const leagueAdmins: User[] = getNotNull(await this.leaguesService.getLeagueAdmins(params.leagueId));

    const isAdmin: boolean = leagueAdmins.some(admin => admin.id === user.id);

    if (user.id !== params.userId && !isAdmin) {
      throw new HttpException(`Not user and not league admin`, HttpStatus.FORBIDDEN);
    }

    return this.matchesService.getUserLeagueMatches(params);
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
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
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
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  @UseInterceptors(FileInterceptor('matches'))
  @ApiOperation({ summary: 'Upload file' })
  async createMatches(@Param() params: LeagueParams, @UploadedFile() file): Promise<Match[]> {
    const dtos: CreateMatchDto[] = await this.validateUpload(params, file);

    let matches: Match[] = [];
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
  @UseGuards(JwtAuthGuard, LeagueUserGuard)
  @UseInterceptors(FileInterceptor('report'))
  @ApiOperation({ summary: 'Upload report' })
  async uploadReport(
    @Request() request,
    @Param() params: LeagueMatchReportParams,
    @UploadedFile() file,
  ): Promise<Match> {
    const user = getNotNull(await this.usersService.getById(request.user.id));
    await this.matchesService.validateUserMatchAssignment(user, params.matchId);
    this.matchesService.validateUserAction(user, params.reportType, ActionType.Write);

    const formattedDate = dayjs().format(S3FileKeyDateFormat);
    const key = `league=${params.leagueId}/match=${params.matchId}/report=${params.reportType}/${params.reportType} ${formattedDate}.pdf`;

    await this.s3Service.upload(S3Bucket.GradesBucket, key, file);
    return this.matchesService.updateReportData(params.matchId, params.reportType, key);
  }

  @Get('leagues/:leagueId/matches/:matchId/reports/:reportType')
  @UseGuards(JwtAuthGuard, LeagueUserGuard)
  @ApiOperation({ summary: 'Download report' })
  async getReport(@Request() request, @Param() params: LeagueMatchReportParams) {
    const user = getNotNull(await this.usersService.getById(request.user.id));
    await this.matchesService.validateUserMatchAssignment(user, params.matchId);
    this.matchesService.validateUserAction(user, params.reportType, ActionType.Read);

    const key = await this.matchesService.getKeyForReport(params.matchId, params.reportType);

    return this.s3Service.getPresignedUrl(S3Bucket.GradesBucket, key);
  }

  @Delete('leagues/:leagueId/matches/:matchId/reports/:reportType')
  @UseGuards(JwtAuthGuard, LeagueUserGuard)
  @ApiOperation({ summary: 'Delete report' })
  async removeReport(@Request() request, @Param() params: LeagueMatchReportParams): Promise<Match> {
    const user = getNotNull(await this.usersService.getById(request.user.id));
    await this.matchesService.validateUserMatchAssignment(user, params.matchId);
    this.matchesService.validateUserAction(user, params.reportType, ActionType.Write);

    return this.matchesService.removeReport(params.matchId, params.reportType);
  }
}
