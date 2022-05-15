import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { uuid } from '../shared/types/uuid';

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

  @ManyToMany(() => User, { cascade: true/*, eager: true*/ })
  @JoinTable()
  observers: User[];

  @ManyToMany(() => User, { cascade: true/*, eager: true*/ })
  @JoinTable()
  referees: User[];

  @ManyToMany(() => User, { cascade: true/*, eager: true*/ })
  @JoinTable()
  admins: User[];
}
