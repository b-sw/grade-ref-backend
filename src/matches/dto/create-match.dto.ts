import { uuid } from '../../types/uuid';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsUUID, Length } from 'class-validator';

export class CreateMatchDto {
  @ApiProperty()
  @IsDate()
  date: Date

  @ApiProperty()
  @Length(5, 50, { message: 'Stadium name too long.'})
  stadium: string;

  @ApiProperty({ type: String })
  @IsUUID()
  homeTeamId: uuid;

  @ApiProperty({ type: String })
  @IsUUID()
  awayTeamId: uuid;

  @ApiProperty({ type: String })
  @IsUUID()
  refereeId: uuid;

  @ApiProperty({ type: String })
  @IsUUID()
  observerId: uuid;
}
