import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { LeagueMatchParams } from 'src/modules/matches/params/LeagueMatchParams';
import { uuid } from 'src/shared/types/uuid.type';

export class FeatureParams extends LeagueMatchParams {
    @ApiProperty({ type: String })
    @IsUUID()
    featureId: uuid;
}
