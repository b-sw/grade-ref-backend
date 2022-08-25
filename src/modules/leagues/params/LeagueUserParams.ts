import { ApiProperty } from '@nestjs/swagger';
import { uuid } from 'src/shared/types/uuid.type';
import { IsUUID } from 'class-validator';
import { LeagueParams } from 'src/modules/leagues/params/LeagueParams';

export class LeagueUserParams extends LeagueParams {
  @ApiProperty({ type: String })
  @IsUUID()
  userId: uuid;
}
