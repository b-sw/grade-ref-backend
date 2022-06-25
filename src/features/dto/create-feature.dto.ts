import { FeatureType } from '../../shared/types/featureType';
import { uuid } from '../../shared/types/uuid';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Length } from 'class-validator';

export class CreateFeatureDto {
  @ApiProperty()
  type: FeatureType;

  @ApiProperty()
  @Length(5, 100)
  description: string;

  @ApiProperty({ type: String })
  @IsUUID()
  refereeId: uuid;
}
