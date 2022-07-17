import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '../../shared/constants/uuid.constant';
import { IsUUID } from 'class-validator';
import { LeagueParams } from '../../leagues/params/LeagueParams';

export class LeagueTeamParams extends LeagueParams {
  @ApiProperty({ type: String })
  @IsUUID()
  teamId: uuid;
}
