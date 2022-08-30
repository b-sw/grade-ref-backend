import { Module } from '@nestjs/common';
import { VideoClipsService } from './video-clips.service';
import { VideoClipsController } from './video-clips.controller';

@Module({
    controllers: [VideoClipsController],
    providers: [VideoClipsService],
})
export class VideoClipsModule {}
