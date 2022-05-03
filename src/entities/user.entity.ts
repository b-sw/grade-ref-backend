import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { uuid } from '../types/uuid';
import { Role } from '../types/role';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column({ unique: true })
  email: string;

  @Column()
  role: Role;

  @Column()
  phoneNumber: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;
}
