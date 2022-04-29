import { ApiProperty } from '@nestjs/swagger';
import { Length } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty()
  @Length(5, 50, { message: 'Team name too long.'})
  name: string;
}
