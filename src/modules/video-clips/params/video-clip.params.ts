import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { uuid } from 'src/shared/types/uuid.type';
import { LeagueMatchParams } from 'src/modules/matches/params/LeagueMatchParams';

export class VideoClipParams extends LeagueMatchParams {
    @ApiProperty({ type: String })
    @IsUUID()
    videoClipId: uuid;
}
