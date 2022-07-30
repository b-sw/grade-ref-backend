import { CreateFeatureDto } from '../../src/domains/features/dto/create-feature.dto';
import { FeatureType } from '../../src/entities/feature.entity';

export const MockCreateFeatureDto = (type?: FeatureType): CreateFeatureDto => {
  return {
    type: type ?? FeatureType.Positive,
    description: 'Mock feature',
  };
};
