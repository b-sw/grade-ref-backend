import { Injectable } from '@nestjs/common';
import { VideoClip } from 'src/entities/video-clip.entity';

@Injectable()
export class VideoClipsService {
    findOneById(): Promise<VideoClip> {
        return Promise.resolve(new VideoClip())
    }

    findAllByMatchId(): Promise<VideoClip[]> {
        return Promise.resolve([])
    }

    upload(): Promise<VideoClip> {
        return Promise.resolve(new VideoClip())
    }

    remove(): Promise<VideoClip> {
        return Promise.resolve(new VideoClip())
    }
}
