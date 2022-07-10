import { CreateFeatureDto } from '../../src/features/dto/create-feature.dto';
import { uuid } from 'aws-sdk/clients/customerprofiles';
import { FeatureType } from '../../src/entities/feature.entity';

export const MockCreateFeatureDto = (refereeId: uuid,
                                     type?: FeatureType): CreateFeatureDto => {
  return {
    type: type ?? FeatureType.Positive,
    description: 'Mock feature',
    refereeId: refereeId,
  };
};