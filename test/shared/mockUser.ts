import { v4 as randomUuid } from 'uuid';
import { Role } from 'src/modules/users/constants/users.constants';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { User } from 'src/entities/user.entity';

export const BaseCreateUserDto = (): CreateUserDto => {
  return {
    email: 'jdoe@mail.com',
    role: Role.Referee,
    phoneNumber: randomUuid().substring(0, 9), // for tests, we just need this to be unique
    firstName: 'John',
    lastName: 'Doe',
  };
};

export const MockCreateUserDto = (overwrite: Partial<CreateUserDto>): CreateUserDto => {
  return { ...BaseCreateUserDto(), ...overwrite };
};

export const MockUser = (overwrite: Partial<User>): User => {
  const uuid = randomUuid();
  return { ...BaseCreateUserDto(), id: uuid, ...overwrite };
};
