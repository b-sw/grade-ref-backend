import { uuid } from '../../../shared/constants/uuid.constant';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Length } from 'class-validator';
import { FeatureType } from '../../../entities/feature.entity';

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
