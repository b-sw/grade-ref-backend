import { Injectable } from '@nestjs/common';
import { VideoClip } from 'src/entities/video-clip.entity';

@Injectable()
export class VideoClipsService {
    findOneById(): Promise<VideoClip> {}

    findAllByMatchId(): Promise<VideoClip[]> {}

    upload(): Promise<VideoClip> {}

    remove(): Promise<VideoClip> {}
}
