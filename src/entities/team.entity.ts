import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { uuid } from '../shared/types/uuid';
import { League } from './league.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column({ unique: true })
  name: string;

  @Column()
  leagueId: uuid;

  @ManyToOne(() => League, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leagueId' })
  league: League
}
