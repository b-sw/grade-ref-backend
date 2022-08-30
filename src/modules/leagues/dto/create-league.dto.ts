import { ApiProperty } from '@nestjs/swagger';
import { Length } from 'class-validator';

export class CreateLeagueDto {
    @ApiProperty()
    @Length(5, 50, { message: 'League name must have 5-50 characters.' })
    name: string;

    @ApiProperty()
    @Length(2, 5, { message: 'League short name must have 2-5 characters.' })
    shortName: string;

    @ApiProperty()
    @Length(4, 15, { message: 'Country must have 4-15 characters.' })
    country: string;
}
