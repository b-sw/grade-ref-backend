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
  UseGuards,
} from '@nestjs/common';
import { FeaturesService } from './features.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MatchesService } from '../matches/matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeagueMatchParams } from '../matches/params/LeagueMatchParams';
import { Feature } from '../../entities/feature.entity';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { FeatureParams } from './params/FeatureParams';
import { UserParams } from '../users/params/UserParams';
import { uuid } from '../../shared/constants/uuid.constant';
import { UsersService } from '../users/users.service';
import { SelfGuard } from '../../shared/guards/self.guard';
import { getNotNull } from '../../shared/getters';
import { Role } from '../users/constants/users.constants';
import { MatchRoleGuard } from '../../shared/guards/matchRoleGuard';

@ApiTags('features')
@Controller('')
@ApiBearerAuth()
export class FeaturesController {
  constructor(
    private readonly featuresService: FeaturesService,
    private readonly matchesService: MatchesService,
    private readonly usersService: UsersService,
  ) {}

  @Post('leagues/:leagueId/matches/:matchId/features')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Create feature' })
  async create(@Request() req, @Param() params: LeagueMatchParams, @Body() dto: CreateFeatureDto): Promise<Feature> {
    const match = getNotNull(await this.matchesService.getById(params.matchId));
    const referee = getNotNull(await this.usersService.getById(match.refereeId));
    return await this.featuresService.create(dto, params.matchId, referee.id);
  }

  @Get('leagues/:leagueId/matches/:matchId/features')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Referee, Role.Observer, Role.Admin]))
  @ApiOperation({ summary: 'Get match features' })
  async getMatchFeatures(@Request() req, @Param() params: LeagueMatchParams): Promise<Feature[]> {
    return await this.featuresService.getByMatch(params.matchId);
  }

  @Get('users/:userId/features')
  @UseGuards(JwtAuthGuard, SelfGuard)
  @ApiOperation({ summary: 'Get user features' })
  async getUserFeatures(@Param() params: UserParams): Promise<Feature[]> {
    return await this.featuresService.getByUser(params.userId);
  }

  @Get('leagues/:leagueId/matches/:matchId/features/:featureId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Referee, Role.Observer, Role.Admin]))
  @ApiOperation({ summary: 'Get feature by id' })
  async getById(@Request() req, @Param() params: FeatureParams): Promise<Feature> {
    const match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateFeatureFromMatch(params.featureId, match);

    return await this.featuresService.getById(params.featureId);
  }

  @Put('leagues/:leagueId/matches/:matchId/features/:featureId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Update feature' })
  async update(@Request() req, @Param() params: FeatureParams, @Body() dto: UpdateFeatureDto): Promise<Feature> {
    const match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateFeatureFromMatch(params.featureId, match);

    return await this.featuresService.update(params.featureId, params.matchId, dto);
  }

  @Delete('leagues/:leagueId/matches/:matchId/features/:featureId')
  @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Observer]))
  @ApiOperation({ summary: 'Delete feature' })
  async remove(@Request() req, @Param() params: FeatureParams): Promise<Feature> {
    const match = getNotNull(await this.matchesService.getById(params.matchId));
    await this.validateFeatureFromMatch(params.featureId, match);

    return await this.featuresService.remove(params.featureId);
  }

  async validateFeatureFromMatch(featureId: uuid, match): Promise<void> {
    const feature = getNotNull(await this.featuresService.getById(featureId));
    if (feature.matchId !== match.id) {
      throw new HttpException('Feature is not from the match', HttpStatus.FORBIDDEN);
    }
  }
}
