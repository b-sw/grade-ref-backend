import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '../../shared/constants/uuid.constant';
import { IsUUID } from 'class-validator';
import { LeagueParams } from './LeagueParams';

export class LeagueUserParams extends LeagueParams {
  @ApiProperty({ type: String })
  @IsUUID()
  userId: uuid;
}
