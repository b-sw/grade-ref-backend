import { Module } from '@nestjs/common';
import { VideoClipsService } from './video-clips.service';
import { VideoClipsController } from './video-clips.controller';
import { AWSModule } from 'src/modules/aws/aws.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoClip } from 'src/entities/video-clip.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([VideoClip]),
        AWSModule,
    ],
    controllers: [VideoClipsController],
    providers: [VideoClipsService],
})
export class VideoClipsModule {}
