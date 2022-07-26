import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UseGuards
} from '@nestjs/common';
import { FeaturesService } from './features.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MatchesService } from '../matches/matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeagueMatchParams } from '../matches/params/LeagueMatchParams';
import { Feature } from '../entities/feature.entity';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { FeatureParams } from './params/FeatureParams';
import { UserParams } from '../users/params/UserParams';
import { uuid } from '../shared/constants/uuid.constant';
import { UsersService } from '../users/users.service';
import { SelfGuard } from '../shared/guards/self.guard';
import { Match } from '../entities/match.entity';
import { getNotNull } from '../shared/getters';
import { User } from '../entities/user.entity';
import { LeaguesService } from '../leagues/leagues.service';
import { League } from '../entities/league.entity';
import { Role } from '../users/constants/users.constants';
import { MatchRoleGuard } from '../shared/guards/matchRoleGuard';

@ApiTags('features')
@Controller('')
@ApiBearerAuth()
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService,
              private readonly matchesService: MatchesService,
              private readonly usersService: UsersService,
              private readonly leaguesService: LeaguesService) {}

  @Post('leagues/:leagueId/matches/:matchId/features')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Create feature' })
  async create(@Request() req, @Param() params: LeagueMatchParams, @Body() dto: CreateFeatureDto): Promise<FeatureInfo> {
    const match: Match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateUserAssignedToMatch(req.user.id, params.leagueId, match);
    return await this.featuresService.create(dto, params.matchId);
  }

  @Get('leagues/:leagueId/matches/:matchId/features')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Referee, Role.Observer, Role.Admin]))
  @ApiOperation({ summary: 'Get match features' })
  async getMatchFeatures(@Request() req, @Param() params: LeagueMatchParams): Promise<FeatureInfo[]> {
    const match: Match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateUserAssignedToMatch(req.user.id, params.leagueId, match);

    return await this.featuresService.getByMatch(params.matchId);
  }

  @Get('users/:userId/features')
  @UseGuards(JwtAuthGuard, SelfGuard)
  @ApiOperation({ summary: 'Get user features' })
  async getUserFeatures(@Param() params: UserParams): Promise<FeatureInfo[]> {
    return await this.featuresService.getByUser(params.userId);
  }

  @Get('leagues/:leagueId/matches/:matchId/features/:featureId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Referee, Role.Observer, Role.Admin]))
  @ApiOperation({ summary: 'Get feature by id' })
  async getById(@Request() req, @Param() params: FeatureParams): Promise<FeatureInfo> {
    const match: Match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateUserAssignedToMatch(req.user.id, params.leagueId, match);
    await this.validateFeatureFromMatch(params.featureId, match);

    return await this.featuresService.getById(params.featureId);
  }

  @Put('leagues/:leagueId/matches/:matchId/features/:featureId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Update feature' })
  async update(@Request() req, @Param() params: FeatureParams, @Body() dto: UpdateFeatureDto): Promise<FeatureInfo> {
    const match: Match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateUserAssignedToMatch(req.user.id, params.leagueId, match);
    await this.validateFeatureFromMatch(params.featureId, match);

    return await this.featuresService.update(params.featureId, params.matchId, dto);
  }

  @Delete('leagues/:leagueId/matches/:matchId/features/:featureId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Delete feature' })
  async remove(@Request() req, @Param() params: FeatureParams): Promise<FeatureInfo> {
    const match: Match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateUserAssignedToMatch(req.user.id, params.leagueId, match);
    await this.validateFeatureFromMatch(params.featureId, match);

    return await this.featuresService.remove(params.featureId);
  }

  async validateUserAssignedToMatch(userId: uuid, leagueId: uuid, match: Match): Promise<void> {
    const user: User = getNotNull(await this.usersService.getById(userId));
    const league: League = getNotNull(await this.leaguesService.getLeagueById(leagueId));

    if (user.role === Role.Owner) {
      return;
    }

    if (user.role === Role.Admin && league.admins.some((admin: User) => admin.id === user.id)) {
      return;
    }

    if ([match.refereeId, match.observerId].some((userId: uuid) => userId === user.id)) {
      return;
    }
    throw new HttpException('User is not assigned to the match', HttpStatus.FORBIDDEN);
  }

  async validateFeatureFromMatch(featureId: uuid, match: Match): Promise<void> {
    const feature: Feature = await this.featuresService.getById(featureId);
    if (feature.matchId !== match.id) {
      throw new HttpException('Feature is not from the match', HttpStatus.FORBIDDEN);
    }
  }
}
