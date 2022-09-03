import { Controller, Delete, Get, Logger, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { VideoClipsService } from './video-clips.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VideoClipParams } from './params/video-clip.params';
import { LeagueMatchParams } from 'src/modules/matches/params/LeagueMatchParams';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoClip } from 'src/entities/video-clip.entity';
import { S3Service } from 'src/modules/aws/s3.service';
import { S3Bucket, S3FileKeyDateFormat } from 'src/modules/aws/constants/aws.constants';
import dayjs from 'dayjs';

@ApiTags('video-clips')
@Controller('')
export class VideoClipsController {
    constructor(
        private readonly videoClipsService: VideoClipsService,
        private readonly s3Service: S3Service,
    ) {}

    @Get('leagues/:leagueId/matches/:matchId/video-clips/:videoClipId')
    @ApiOperation({ summary: 'Get videoClip by id' })
    getVideoClipById(@Param() params: VideoClipParams): Promise<VideoClip> {
        return Promise.resolve(new VideoClip())
    }

    @Get('leagues/:leagueId/matches/:matchId/video-clips')
    @ApiOperation({ summary: 'Get videoClips by matchId' })
    getMatchVideoClips(@Param() params: LeagueMatchParams): Promise<VideoClip[]> {
        return Promise.resolve([])
    }

    @Post('leagues/:leagueId/matches/:matchId/video-clips')
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
    @ApiOperation({ summary: 'Delete videoClip' })
    removeVideoClip(@Param() params: VideoClipParams): Promise<VideoClip> {
        return Promise.resolve(new VideoClip())
    }
}
