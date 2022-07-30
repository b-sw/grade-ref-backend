import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { uuid } from 'src/shared/constants/uuid.constant';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { Feature, FeatureType } from '../../entities/feature.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const FEATURES_MATCH_LIMIT = 3;

@Injectable()
export class FeaturesService {
  constructor(@InjectRepository(Feature) private featureRepository: Repository<Feature>) {}

  async create(dto: CreateFeatureDto, matchId: uuid, refereeId: uuid): Promise<Feature> {
    await this.validateFeatureTypeLimit(dto.type, matchId);

    const feature: Feature = await this.featureRepository.create({
      matchId: matchId,
      type: dto.type,
      description: dto.description,
      refereeId: refereeId,
    });
    return this.featureRepository.save(feature);
  }

  async getById(featureId: uuid): Promise<Feature | undefined> {
    return await this.featureRepository.findOne({ where: { id: featureId } });
  }

  async getByMatch(matchId: uuid): Promise<Feature[]> {
    return await this.featureRepository.find({ where: { matchId: matchId } });
  }

  async getByUser(userId: uuid): Promise<Feature[]> {
    return await this.featureRepository.find({ where: { refereeId: userId } });
  }

  async update(featureId: uuid, matchId: uuid, dto: UpdateFeatureDto): Promise<Feature> {
    await this.validateFeatureTypeLimit(dto.type, matchId);
    await this.featureRepository.update(featureId, {
      type: dto.type,
      description: dto.description,
    });
    return this.getById(featureId);
  }

  async remove(featureId: uuid): Promise<Feature> {
    const feature: Feature = await this.getById(featureId);
    await this.featureRepository.delete(featureId);
    return feature;
  }

  async validateFeatureTypeLimit(featureType: FeatureType, matchId: uuid): Promise<void> {
    const matchFeatures: Feature[] = await this.featureRepository.find({
      where: { matchId: matchId, type: featureType },
    });
    if (matchFeatures.length === FEATURES_MATCH_LIMIT) {
      throw new HttpException(
        `You can create a maximum of 3 ${featureType} features per match`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
