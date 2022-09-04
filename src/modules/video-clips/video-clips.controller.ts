import { Controller, Delete, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { VideoClipsService } from './video-clips.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VideoClipParams } from './params/video-clip.params';
import { LeagueMatchParams } from 'src/modules/matches/params/LeagueMatchParams';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoClip } from 'src/entities/video-clip.entity';
import { S3Service } from 'src/modules/aws/s3.service';
import { S3Bucket, S3FileKeyDateFormat } from 'src/modules/aws/constants/aws.constants';
import { getNotNull } from 'src/shared/getters';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { MatchRoleGuard } from 'src/shared/guards/matchRoleGuard';
import { Role } from 'src/modules/users/constants/users.constants';
import dayjs from 'dayjs';

@ApiTags('video-clips')
@Controller('')
@ApiBearerAuth()
export class VideoClipsController {
    constructor(
        private readonly videoClipsService: VideoClipsService,
        private readonly s3Service: S3Service,
    ) {}

    @Get('leagues/:leagueId/matches/:matchId/video-clips/:videoClipId')
    @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin, Role.Referee, Role.Observer]))
    @ApiOperation({ summary: 'Get videoClip by id' })
    async getVideoClipById(@Param() params: VideoClipParams): Promise<string> {
        const video = getNotNull(await this.videoClipsService.findOneById(params.videoClipId))
        return this.s3Service.getPresignedUrl(S3Bucket.VideoClipsBucket, video.path)
    }

    @Get('leagues/:leagueId/matches/:matchId/video-clips')
    @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin, Role.Referee, Role.Observer]))
    @ApiOperation({ summary: 'Get videoClips by matchId' })
    getMatchVideoClips(@Param() params: LeagueMatchParams): Promise<VideoClip[]> {
        return this.videoClipsService.findAllByMatchId(params.matchId)
    }

    @Post('leagues/:leagueId/matches/:matchId/video-clips')
    @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin, Role.Referee]))
    @UseInterceptors(FileInterceptor('videoclip'))
    @ApiOperation({ summary: 'Upload videoClip' })
    async uploadVideoClip(@Param() params: LeagueMatchParams, @UploadedFile() file): Promise<VideoClip> {
        const { originalname } = file;

        const date = dayjs();
        const dateFormatted = date.format(S3FileKeyDateFormat);

        const key = `league=${params.leagueId}/match=${params.matchId} ${originalname} ${date}.mp4`;

        await this.s3Service.upload(S3Bucket.VideoClipsBucket, key, file);
        return this.videoClipsService.upload(originalname, params.matchId, date.toDate(), key)
    }

    @Delete('leagues/:leagueId/matches/:matchId/video-clips/:videoClipId')
    @UseGuards(JwtAuthGuard, MatchRoleGuard([Role.Admin, Role.Referee]))
    @ApiOperation({ summary: 'Delete videoClip' })
    async removeVideoClip(@Param() params: VideoClipParams) {
        const video = getNotNull(await this.videoClipsService.findOneById(params.videoClipId));

        this.s3Service.delete(S3Bucket.VideoClipsBucket, video.path)
        this.videoClipsService.remove(params.videoClipId)
    }
}
