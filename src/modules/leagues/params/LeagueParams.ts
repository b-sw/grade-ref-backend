import { ApiProperty } from '@nestjs/swagger';
import { uuid } from 'src/shared/types/uuid.type';
import { IsUUID } from 'class-validator';

export class LeagueParams {
    @ApiProperty({ type: String })
    @IsUUID()
    leagueId: uuid;
}
