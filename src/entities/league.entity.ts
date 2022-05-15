import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { uuid } from '../shared/types/uuid';
import { User } from './user.entity';

@Entity()
export class League {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column()
  name: string;

  @Column()
  shortName: string;

  @Column()
  country: string;

  @ManyToMany(() => User, { onDelete: 'CASCADE' })
  @JoinTable()
  observers: User[];

  @ManyToMany(() => User, { onDelete: 'CASCADE' })
  @JoinTable()
  referees: User[];

  @ManyToMany(() => User, { onDelete: 'CASCADE' })
  @JoinTable()
  admins: User[];
}
