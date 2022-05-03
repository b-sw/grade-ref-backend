import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from "class-validator";
import { Role } from '../../types/role';

export class CreateUserDto {
  @ApiProperty()
  @MaxLength(100, { message: 'Email too long.'})
  email: string;

  @ApiProperty()
  role: Role;

  @ApiProperty()
  @MaxLength(15, { message: 'Phone number too long.' })
  phoneNumber: string

  @ApiProperty()
  @MaxLength(15, { message: 'First name too long.' })
  firstName: string;

  @ApiProperty()
  @MaxLength(15, { message: 'Last name too long.' })
  lastName: string;
}
