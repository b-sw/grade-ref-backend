import { uuid } from '../../types/uuid';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsUUID, Max, Min } from 'class-validator';

export class CreateGradeDto {
  @ApiProperty()
  @IsDate()
  date: Date;

  @ApiProperty({ type: String })
  @IsUUID()
  matchId: uuid;

  @ApiProperty({ type: String })
  @IsUUID()
  observerId: uuid;

  @ApiProperty()
  @Min(0)
  @Max(10)
  value: number;
}
