import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { League } from 'src/entities/league.entity';
import { uuid } from 'src/shared/types/uuid.type';

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
  league: League;
}
