import { User } from '../../src/entities/user.entity';
import { Role } from '../../src/shared/types/role';
import { v4 as randomUuid } from 'uuid';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';

const BaseCreateUserDto: CreateUserDto = {
  email: 'jdoe@mail.com',
  role: Role.Referee,
  phoneNumber: '+48 111 222 333',
  firstName: 'John',
  lastName: 'Doe',
}

const BaseUser: User = { ...BaseCreateUserDto, id: randomUuid() }

export const MockCreateUserDto = (overwrite: Partial<CreateUserDto>): CreateUserDto => {
  return { ...BaseCreateUserDto, ...overwrite };
}

export const MockUser = (overwrite: Partial<User>): User => {
  return { ...BaseUser, ...overwrite };
}