import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { uuid } from '../shared/types/uuid';
import { Role } from '../shared/types/role';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column({ unique: true })
  email: string;

  @Column()
  role: Role;

  // todo: restore '{ unique: true }' for beta version
  @Column()
  phoneNumber: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;
}
