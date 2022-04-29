import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { uuid } from '../types/uuid';
import { User } from './user.entity';
import { Team } from './team.entity';
import { Type } from 'class-transformer';

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column()
  @Type(() => Date)
  date: Date

  @Column()
  stadium: string;

  @Column()
  homeTeamId: uuid;

  @Column()
  awayTeamId: uuid;

  @Column()
  refereeId: uuid;

  @Column()
  observerId: uuid;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'homeTeamId' })
  homeTeam: Team

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'awayTeamId' })
  awayTeam: Team

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'refereeId' })
  referee: User

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'observerId' })
  observer: User
}
