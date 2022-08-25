import { uuid } from 'src/shared/types/uuid.type';
import { Role } from 'src/modules/users/constants/users.constants';

export type UserCredentialsType = {
  id: uuid;
  email: string;
  accessToken: string;
  role: Role;
  firstName: string;
  lastName: string;
};
