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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MatchRoleGuard } from 'src/shared/guards/matchRoleGuard';
import { LeagueMatchParams } from 'src/modules/matches/params/LeagueMatchParams';
import { UsersService } from 'src/modules/users/users.service';
import { MatchesService } from 'src/modules/matches/matches.service';
import { getNotNull } from 'src/shared/getters';
import { SelfGuard } from 'src/shared/guards/self.guard';
import { Role } from 'src/modules/users/constants/users.constants';
import { CreateFeatureDto } from 'src/modules/features/dto/create-feature.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { FeatureParams } from 'src/modules/features/path-params/feature.path-params';
import { UpdateFeatureDto } from 'src/modules/features/dto/update-feature.dto';
import { FeaturesService } from 'src/modules/features/features.service';
import { UserParams } from 'src/modules/users/params/UserParams';
import { Feature } from 'src/entities/feature.entity';
import { uuid } from 'src/shared/types/uuid.type';

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
