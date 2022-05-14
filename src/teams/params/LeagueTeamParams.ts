import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '../../shared/types/uuid';
import { IsUUID } from 'class-validator';

export class LeagueTeamParams {
  @ApiProperty({ type: String })
  @IsUUID()
  leagueId: uuid;

  @ApiProperty({ type: String })
  @IsUUID()
  teamId: uuid;
}
