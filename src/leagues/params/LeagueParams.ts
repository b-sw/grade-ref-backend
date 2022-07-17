import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '../../shared/constants/uuid.constant';
import { IsUUID } from 'class-validator';

export class LeagueParams {
  @ApiProperty({ type: String })
  @IsUUID()
  leagueId: uuid;
}
