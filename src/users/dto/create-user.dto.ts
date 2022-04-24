import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from "class-validator";
import { Role } from '../../types/role';

export class CreateUserDto {
  @ApiProperty()
  @MaxLength(100, { message: 'Email too long.'})
  email: string;

  @ApiProperty()
  role: Role;
}
