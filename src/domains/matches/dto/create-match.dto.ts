import { uuid } from '../../../shared/constants/uuid.constant';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateMatchDto {
  @ApiProperty({ type: Date })
  @IsDate()
  matchDate: Date;

  @ApiProperty()
  @Length(5, 50)
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

  @ApiProperty({ nullable: true })
  @Length(5, 1000)
  refereeNote: string;

  @ApiProperty({ nullable: true })
  @Length(5, 500)
  overallGrade: string;

  @ApiProperty({ nullable: true })
  @IsDate()
  overallGradeDate: Date;
}
