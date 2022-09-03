import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VideoClip } from 'src/entities/video-clip.entity';
import { uuid } from 'src/shared/types/uuid.type';
import { Repository } from 'typeorm';

@Injectable()
export class VideoClipsService {
    constructor(
        @InjectRepository(VideoClip) private videosRepository: Repository<VideoClip>,
    ) {}

    findOneById(videoId: uuid): Promise<VideoClip> {
        return this.videosRepository.findOne(videoId)
    }

    findAllByMatchId(): Promise<VideoClip[]> {
        return Promise.resolve([])
    }

    upload(name: string, matchId: uuid, uploadDate: Date, path: string): Promise<VideoClip> {
        const video: VideoClip = this.videosRepository.create({
            name: name,
            matchId: matchId,
            uploadDate: uploadDate,
            path: path,
        })
        return this.videosRepository.save(video)
    }

    remove(): Promise<VideoClip> {
        return Promise.resolve(new VideoClip())
    }

}
