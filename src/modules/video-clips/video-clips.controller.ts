import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { VideoClipsService } from './video-clips.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VideoClipParams } from './params/video-clip.params';
import { LeagueMatchParams } from 'src/modules/matches/params/LeagueMatchParams';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoClip } from 'src/entities/video-clip.entity';

@ApiTags('video-clips')
@Controller('')
export class VideoClipsController {
    constructor(private readonly videoClipsService: VideoClipsService) {}

    @Get('leagues/:leagueId/matches/:matchId/video-clips/:videoClipId')
    @ApiOperation({ summary: 'Get videoClip by id' })
    getVideoClipById(@Param() params: VideoClipParams): Promise<VideoClip> {}

    @Get('leagues/:leagueId/matches/:matchId/video-clips')
    @ApiOperation({ summary: 'Get videoClips by matchId' })
    getMatchVideoClips(@Param() params: LeagueMatchParams): Promise<VideoClip[]> {}

    @Post('leagues/:leagueId/matches/:matchId/video-clips')
    @UseInterceptors(FileInterceptor('video-clip'))
    @ApiOperation({ summary: 'Upload videoClip' })
    uploadVideoClip(@Param() params: LeagueMatchParams, @UploadedFile() file): Promise<VideoClip> {}

    @Delete('leagues/:leagueId/matches/:matchId/video-clips/:videoClipId')
    @ApiOperation({ summary: 'Delete videoClip' })
    removeVideoClip(@Param() params: VideoClipParams): Promise<VideoClip> {}
}
