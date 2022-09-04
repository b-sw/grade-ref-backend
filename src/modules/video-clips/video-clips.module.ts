import { Module } from '@nestjs/common';
import { VideoClipsService } from './video-clips.service';
import { VideoClipsController } from './video-clips.controller';
import { AWSModule } from 'src/modules/aws/aws.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoClip } from 'src/entities/video-clip.entity';
import { LeaguesModule } from 'src/modules/leagues/leagues.module';
import { UsersModule } from 'src/modules/users/users.module';
import { MatchesModule } from '../matches/matches.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([VideoClip]),
        AWSModule,
        LeaguesModule,
        UsersModule,
        MatchesModule
    ],
    controllers: [VideoClipsController],
    providers: [VideoClipsService],
})
export class VideoClipsModule {}
