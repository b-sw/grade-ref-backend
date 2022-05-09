import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '../../types/uuid';
import { IsUUID } from 'class-validator';

export class LeagueParams {
  @ApiProperty({ type: String })
  @IsUUID()
  leagueId: uuid;
}
