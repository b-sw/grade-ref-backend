import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { uuid } from '../shared/constants/uuid.constant';
import { Team } from './team.entity';
import { Match } from './match.entity';

export enum Card {
  Yellow = 'Yellow',
  Red = 'Red',
}

@Entity()
export class Foul {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column()
  minute: number;

  @Column()
  card: Card;

  @Column()
  playerNumber: number;

  @Column()
  description: string;

  @Column()
  valid: boolean;

  @Column()
  teamId: uuid;

  @Column()
  matchId: uuid;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;
}
