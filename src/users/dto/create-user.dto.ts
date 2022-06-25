import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, Length, MaxLength } from 'class-validator';
import { Role } from '../../shared/types/role';

export class CreateUserDto {
  @ApiProperty()
  @Length(5, 50)
  email: string;

  @ApiProperty()
  @IsEnum(Role)
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
