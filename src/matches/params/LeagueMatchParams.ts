import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '../../types/uuid';
import { IsUUID } from 'class-validator';

export class LeagueMatchParams {
  @ApiProperty({ type: String })
  @IsUUID()
  leagueId: uuid;

  @ApiProperty({ type: String })
  @IsUUID()
  matchId: uuid;
}
