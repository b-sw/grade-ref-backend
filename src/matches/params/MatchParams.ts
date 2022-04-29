import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '../../types/uuid';
import { IsUUID } from 'class-validator';

export class MatchParams {
  @ApiProperty({ type: String })
  @IsUUID()
  id: uuid;
}
