import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { LeagueParams } from 'src/modules/leagues/params/LeagueParams';
import { uuid } from 'src/shared/types/uuid.type';

export class LeagueTeamParams extends LeagueParams {
    @ApiProperty({ type: String })
    @IsUUID()
    teamId: uuid;
}
