import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Length, Max, Min } from 'class-validator';
import { uuid } from '../../shared/types/uuid';
import { Card } from '../../shared/types/card';

export class CreateFoulDto {
  @ApiProperty()
  @Min(0)
  @Max(100)
  minute: number;

  @ApiProperty()
  card: Card;

  @ApiProperty()
  @Min(0)
  @Max(100)
  playerNumber: number;

  @ApiProperty()
  @Length(5, 400)
  description: string;

  @ApiProperty()
  valid: boolean;

  @ApiProperty({ type: String })
  @IsUUID()
  teamId: uuid;
}
