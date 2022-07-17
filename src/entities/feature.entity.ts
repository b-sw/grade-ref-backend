import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { uuid } from '../shared/constants/uuid.constant';
import { Match } from './match.entity';
import { User } from './user.entity';

export enum FeatureType {
  Positive = 'Positive',
  Negative = 'Negative',
}

@Entity()
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column()
  type: FeatureType;

  @Column()
  description: string;

  @Column()
  refereeId: uuid;

  @Column()
  matchId: uuid;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'refereeId' })
  referee: User;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;
}
