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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DTO_DATETIME_FORMAT, MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserParams } from '../users/params/UserParams';
import { LeagueMatchParams } from './params/LeagueMatchParams';
import { LeagueParams } from '../leagues/params/LeagueParams';
import { ActionType, Match } from '../entities/match.entity';
import { OwnerGuard } from '../shared/guards/owner.guard';
import { LeagueAdminGuard } from '../shared/guards/league-admin.guard';
import { SelfGuard } from '../shared/guards/self.guard';
import { LeaguesService } from '../leagues/leagues.service';
import { TeamsService } from '../teams/teams.service';
import { League } from '../entities/league.entity';
import { Team } from '../entities/team.entity';
import { uuid } from '../shared/types/uuid';
import { ValidRefereeObserverGuard } from '../shared/guards/valid-referee-observer-guard.service';
import { LeagueUserParams } from '../leagues/params/LeagueUserParams';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';
import { MatchGradeGuard } from '../shared/guards/match-grade.guard';
import { GradeMessage } from './dto/update-grade-sms.dto';
import { getNotNull } from '../shared/getters';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoleGuard } from '../shared/guards/role.guard';
import { Role } from '../shared/types/role';
import { S3Bucket, S3Service } from 'src/aws/s3.service';
import { LeagueMatchReportParams } from './params/LeagueMatchReportParams';
import dayjs from 'dayjs';
import { LeagueUserGuard } from 'src/shared/guards/league-user.guard';
import { response } from 'express';
import { isRFC3339 } from 'class-validator';

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
  async createMatch(
    @Param() params: LeagueParams,
    @Body() dto: CreateMatchDto,
  ): Promise<Match> {
    const { leagueIdx, homeTeamIdx } = await this.getUserReadableKeyParams(
      dto.homeTeamId,
    );
    const observer: User = getNotNull(
      await this.usersService.getById(dto.observerId),
    );
    return this.matchesService.createMatch(
      params.leagueId,
      dto,
      leagueIdx,
      homeTeamIdx,
      observer.phoneNumber,
    );
  }

  @Put('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard, ValidRefereeObserverGuard)
  @ApiOperation({ summary: 'Update match' })
  async updateMatch(
    @Param() params: LeagueMatchParams,
    @Body() dto: UpdateMatchDto,
  ): Promise<Match> {
    const { leagueIdx, homeTeamIdx } = await this.getUserReadableKeyParams(
      dto.homeTeamId,
    );
    const observer: User = getNotNull(
      await this.usersService.getById(dto.observerId),
    );
    return this.matchesService.updateMatch(
      params,
      dto,
      leagueIdx,
      homeTeamIdx,
      observer.phoneNumber,
    );
  }

  @Put('leagues/:leagueId/matches/:matchId/grade')
  @UseGuards(JwtAuthGuard, RoleGuard(Role.Observer))
  @ApiOperation({ summary: 'Update referee match grade' })
  async updateMatchGrade(
    @Param() params: LeagueMatchParams,
    @Body() dto: Partial<UpdateMatchDto>,
  ): Promise<Match> {
    return this.matchesService.updateGrade(params, dto);
  }

  @Put('leagues/:leagueId/matches/:matchId/overallGrade')
  @UseGuards(JwtAuthGuard, RoleGuard(Role.Observer))
  @ApiOperation({ summary: 'Update referee overall grade' })
  async updateMatchOverallGrade(
    @Param() params: LeagueMatchParams,
    @Body() dto: Partial<UpdateMatchDto>,
  ): Promise<Match> {
    return this.matchesService.updateOverallGrade(params, dto);
  }

  @Post('matches/grades')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MatchGradeGuard)
  @ApiOperation({ summary: 'Update referee match grade by sms' })
  async updateMatchGradeSms(@Request() req): Promise<void> {
    Logger.log(req.body, 'Update match grade sms');
    const message: GradeMessage = JSON.parse(req.body.message);
    const observer: User = getNotNull(
      await this.usersService.getByPhoneNumber(message.msisdn),
    );
    return this.matchesService.updateGradeSms(message, observer);
  }

  @Delete('leagues/:leagueId/matches/:matchId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  @ApiOperation({ summary: 'Delete match' })
  async removeMatch(@Param() params: LeagueMatchParams): Promise<Match> {
    const match: Match = getNotNull(
      await this.matchesService.getById(params.matchId),
    );
    const observer: User = getNotNull(
      await this.usersService.getById(match.observerId),
    );
    return this.matchesService.removeMatch(params, observer.phoneNumber);
  }

  @Get('users/:userId/matches')
  @UseGuards(JwtAuthGuard, SelfGuard)
  @ApiOperation({ summary: 'Get user matches' })
  async getUserMatches(@Param() params: UserParams): Promise<Match[]> {
    return this.matchesService.getUserMatches(params);
  }

  @Get('users/:userId/leagues/:leagueId/matches')
  @UseGuards(JwtAuthGuard) // todo: add guard
  @ApiOperation({ summary: 'Get user league matches' })
  async getUserLeagueMatches(
    @Param() params: LeagueUserParams,
  ): Promise<Match[]> {
    return this.matchesService.getUserLeagueMatches(params);
  }

  async getUserReadableKeyParams(
    homeTeamId: uuid,
  ): Promise<{ leagueIdx: number; homeTeamIdx: number }> {
    const homeTeam: Team = await this.teamsService.getById(homeTeamId);
    const leagues: League[] = await this.leaguesService.getLeagues();
    const teamLeague: League = await this.leaguesService.getLeagueById(
      homeTeam.leagueId,
    );
    const teams: Team[] = await this.teamsService.getAllByLeagueId(
      teamLeague.id,
    );

    leagues.sort((a, b) => a.name.localeCompare(b.name));
    teams.sort((a, b) => a.name.localeCompare(b.name));

    const leagueIdx: number = leagues.findIndex(
      (league) => league.id === league.id,
    );
    const homeTeamIdx: number = teams.findIndex(
      (team) => team.id === homeTeam.id,
    );

    return { leagueIdx, homeTeamIdx };
  }

  @Post('leagues/:leagueId/matches/upload/validate')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  @UseInterceptors(FileInterceptor('matches'))
  @ApiOperation({ summary: 'Validate file' })
  async validateUpload(
    @Param() params: LeagueParams,
    @UploadedFile() file,
  ): Promise<CreateMatchDto[]> {
    const teams: Team[] = await this.teamsService.getAllByLeagueId(
      params.leagueId,
    );
    const referees: User[] = await this.leaguesService.getLeagueReferees(
      params.leagueId,
    );
    const observers: User[] = await this.leaguesService.getLeagueObservers(
      params.leagueId,
    );

    const { buffer } = file;
    await this.matchesService.validateMatches(
      buffer.toString(),
      params.leagueId,
      teams,
      referees,
      observers,
    );
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
  async createMatches(
    @Param() params: LeagueParams,
    @UploadedFile() file,
  ): Promise<Match[]> {
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
    await this.s3Service.upload(S3Bucket.MATCHES_BUCKET, key, file);

    return matches;
  }

  @Post('leagues/:leagueId/matches/:matchId/reports/:reportType')
  @UseGuards(JwtAuthGuard, LeagueUserGuard)
  @UseInterceptors(FileInterceptor('report'))
  @ApiOperation({ summary: 'Upload file' })
  async uploadReport(
    @Request() request,
    @Param() params: LeagueMatchReportParams,
    @UploadedFile() file,
  ): Promise<Match> {
    const user = getNotNull(await this.usersService.getById(request.user.id));
    this.matchesService.validateUserMatchAssignment(user, params.matchId);
    this.matchesService.validateUserAction(
      user,
      params.reportType,
      ActionType.WRITE,
    );

    const formattedDate = dayjs().format('YYYY-MM-DDTHH:mm:ss:SSS');
    const key = `league=${params.leagueId}/match=${params.matchId}/report=${params.reportType}/${params.reportType} ${formattedDate}.pdf`;

    const match = await this.matchesService.updateReportData(
      params.matchId,
      params.reportType,
      key,
    );

    await this.s3Service.upload(S3Bucket.GRADES_BUCKET, key, file);

    return match;
  }

  @Get('leagues/:leagueId/matches/:matchId/reports/:reportType')
  @UseGuards(JwtAuthGuard, LeagueUserGuard)
  @UseInterceptors(FileInterceptor('report'))
  @ApiOperation({ summary: 'Upload file' })
  async getReport(
    @Request() request,
    @Param() params: LeagueMatchReportParams,
    @Res() response,
  ) {
    const user = getNotNull(await this.usersService.getById(request.user.id));
    this.matchesService.validateUserMatchAssignment(user, params.matchId);
    this.matchesService.validateUserAction(
      user,
      params.reportType,
      ActionType.READ,
    );

    const key = await this.matchesService.getKeyForReport(
      params.matchId,
      params.reportType,
    );

    const s3ReadStream = await this.s3Service.getDownloadStream(
      S3Bucket.GRADES_BUCKET,
      key,
    );

    response.setHeader('Content-Type', 'application/pdf');
    s3ReadStream.pipe(response);
  }

  @Delete('leagues/:leagueId/matches/:matchId/reports/:reportType')
  @UseGuards(JwtAuthGuard, LeagueUserGuard)
  @UseInterceptors(FileInterceptor('report'))
  @ApiOperation({ summary: 'Upload file' })
  async removeReport(
    @Request() request,
    @Param() params: LeagueMatchReportParams,
  ): Promise<Match> {
    const user = getNotNull(await this.usersService.getById(request.user.id));
    this.matchesService.validateUserMatchAssignment(user, params.matchId);
    this.matchesService.validateUserAction(
      user,
      params.reportType,
      ActionType.READ,
    );

    return this.matchesService.removeReport(params.matchId, params.reportType);
  }
}
