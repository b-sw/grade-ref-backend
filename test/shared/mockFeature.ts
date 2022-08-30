import { FeatureType } from 'src/entities/feature.entity';
import { CreateFeatureDto } from 'src/modules/features/dto/create-feature.dto';

export const MockCreateFeatureDto = (type?: FeatureType): CreateFeatureDto => {
    return {
        type: type ?? FeatureType.Positive,
        description: 'Mock feature',
    };
};
