import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { uuid } from '../types/uuid';
import { Match } from './match.entity';
import { User } from './user.entity';
import { Type } from 'class-transformer';

@Entity()
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column()
  @Type(() => Date)
  date: Date;

  @Column()
  matchId: uuid;

  @Column()
  observerId: uuid;

  @Column()
  value: number;

  @OneToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'observerId' })
  observer: User;
}
