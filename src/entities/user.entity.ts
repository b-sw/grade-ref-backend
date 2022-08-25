import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { uuid } from 'src/shared/types/uuid.type';
import { Role } from 'src/modules/users/constants/users.constants';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column({ unique: true })
  email: string;

  @Column()
  role: Role;

  @Column({ unique: true })
  phoneNumber: string;

  @Column()
  firstName: string;

  @Column({ unique: true })
  lastName: string;
}
