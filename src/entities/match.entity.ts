import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { uuid } from '../shared/types/uuid';
import { User } from './user.entity';
import { Team } from './team.entity';
import { Type } from 'class-transformer';
import { League } from './league.entity';

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column()
  @Type(() => Date)
  matchDate: Date

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

  @Column()
  leagueId: uuid;

  @Column()
  refereeGrade: number;

  @Column()
  @Type(() => Date)
  refereeGradeDate: Date;

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

  @ManyToOne(() => League, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leagueId' })
  league: League
}
