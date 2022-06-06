import { uuid } from '../../shared/types/uuid';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateMatchDto {
  @ApiProperty({ type: Date })
  @IsDate()
  matchDate: Date

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

  @ApiProperty({ nullable: true })
  @Min(0)
  @Max(10)
  refereeGrade: number;

  @ApiProperty({ nullable: true })
  @IsDate()
  refereeGradeDate: Date;

  @ApiProperty({ nullable: true })
  refereeSmsId: string;

  @ApiProperty({ nullable: true })
  observerSmsId: string;
}
