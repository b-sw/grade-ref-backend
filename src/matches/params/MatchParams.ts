import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '../../shared/types/uuid';
import { IsUUID } from 'class-validator';

export class MatchParams {
  @ApiProperty({ type: String })
  @IsUUID()
  matchId: uuid;
}
