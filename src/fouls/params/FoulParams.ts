import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '../../shared/types/uuid';
import { IsUUID } from 'class-validator';
import { LeagueMatchParams } from '../../matches/params/LeagueMatchParams';

export class FoulParams extends LeagueMatchParams {
  @ApiProperty({ type: String })
  @IsUUID()
  foulId: uuid;
}
