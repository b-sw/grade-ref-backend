import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { uuid } from '../shared/types/uuid';
import { User } from './user.entity';
import { Team } from './team.entity';
import { Type } from 'class-transformer';
import { League } from './league.entity';

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column({ unique: true })
  userReadableKey: string;

  @Column({ type: 'datetime' })
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

  @Column({ type: 'float', nullable: true })
  refereeGrade: number;

  @Column({ type: 'datetime', nullable: true })
  @Type(() => Date)
  refereeGradeDate: Date;

  @Column({ nullable: true })
  refereeSmsId: string;

  @Column({ nullable: true })
  observerSmsId: string;

  @Column({ nullable: true, length: 1000 })
  refereeNote: string;

  @Column({ nullable: true, length: 3000 })
  overallGrade: string;

  @Column({ type: 'datetime', nullable: true })
  @Type(() => Date)
  overallGradeDate: Date;

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
