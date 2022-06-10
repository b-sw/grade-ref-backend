import { User } from '../../src/entities/user.entity';
import { Role } from '../../src/shared/types/role';
import { v4 as randomUuid } from 'uuid';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';

export const BaseCreateUserDto = (): CreateUserDto => {
  return {
    email: 'jdoe@mail.com',
    role: Role.Referee,
    phoneNumber: randomUuid().substring(0, 9), // for tests, we just need this to be unique
    firstName: 'John',
    lastName: 'Doe',
  }
}

export const MockCreateUserDto = (overwrite: Partial<CreateUserDto>): CreateUserDto => {
  return { ...BaseCreateUserDto(), ...overwrite };
}

export const MockUser = (overwrite: Partial<User>): User => {
  return { ...BaseCreateUserDto(), id: randomUuid(), ...overwrite };
}