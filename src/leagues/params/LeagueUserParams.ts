import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '../../shared/types/uuid';
import { IsUUID } from 'class-validator';
import { LeagueParams } from './LeagueParams';

export class LeagueUserParams extends LeagueParams {
  @ApiProperty({ type: String })
  @IsUUID()
  userId: uuid;
}
