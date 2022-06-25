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
import { LeagueUserGuard } from '../shared/guards/league-user.guard';
import { RoleGuard } from '../shared/guards/role.guard';
import { Role } from '../shared/types/role';
import { Feature } from '../entities/feature.entity';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { FeatureParams } from './params/FeatureParams';
import { UserParams } from '../users/params/UserParams';
import { uuid } from '../shared/types/uuid';
import { UsersService } from '../users/users.service';
import { SelfGuard } from '../shared/guards/self.guard';
import { Match } from '../entities/match.entity';
import { getNotNull } from '../shared/getters';
import { User } from '../entities/user.entity';
import { LeaguesService } from '../leagues/leagues.service';
import { League } from '../entities/league.entity';

@ApiTags('features')
@Controller('')
@ApiBearerAuth()
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService,
              private readonly matchesService: MatchesService,
              private readonly usersService: UsersService,
              private readonly leaguesService: LeaguesService) {}

  @Post('leagues/:leagueId/matches/:matchId/features')
  @UseGuards(JwtAuthGuard, RoleGuard(Role.Referee))
  @ApiOperation({ summary: 'Create feature' })
  async create(@Request() req, @Param() params: LeagueMatchParams, @Body() dto: CreateFeatureDto): Promise<Feature> {
    const match: Match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateUserAssignedToMatch(req.user.id, params.leagueId, match);
    return await this.featuresService.create(dto, params.matchId);
  }

  @Get('leagues/:leagueId/matches/:matchId/features')
  @UseGuards(JwtAuthGuard, LeagueUserGuard)
  @ApiOperation({ summary: 'Get match features' })
  async getMatchFeatures(@Request() req, @Param() params: LeagueMatchParams): Promise<Feature[]> {
    const match: Match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateUserAssignedToMatch(req.user.id, params.leagueId, match);

    return await this.featuresService.getByMatch(params.matchId);
  }

  @Get('users/:userId/features')
  @UseGuards(JwtAuthGuard, SelfGuard)
  @ApiOperation({ summary: 'Get user features' })
  async getUserFeatures(@Param() params: UserParams): Promise<Feature[]> {
    return await this.featuresService.getByUser(params.userId);
  }

  @Get('leagues/:leagueId/matches/:matchId/features/:featureId')
  @UseGuards(JwtAuthGuard, LeagueUserGuard)
  @ApiOperation({ summary: 'Get feature by id' })
  async getById(@Request() req, @Param() params: FeatureParams): Promise<Feature> {
    const match: Match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateUserAssignedToMatch(req.user.id, params.leagueId, match);
    await this.validateFeatureFromMatch(params.featureId, match);

    return await this.featuresService.getById(params.featureId);
  }

  @Put('leagues/:leagueId/matches/:matchId/features/:featureId')
  @UseGuards(JwtAuthGuard, RoleGuard(Role.Referee))
  @ApiOperation({ summary: 'Update feature' })
  async update(@Request() req, @Param() params: FeatureParams, @Body() dto: UpdateFeatureDto): Promise<Feature> {
    const match: Match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateUserAssignedToMatch(req.user.id, params.leagueId, match);
    await this.validateFeatureFromMatch(params.featureId, match);

    return await this.featuresService.update(params.featureId, params.matchId, dto);
  }

  @Delete('leagues/:leagueId/matches/:matchId/features/:featureId')
  @UseGuards(JwtAuthGuard, RoleGuard(Role.Referee))
  @ApiOperation({ summary: 'Delete feature' })
  async remove(@Request() req, @Param() params: FeatureParams): Promise<Feature> {
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
