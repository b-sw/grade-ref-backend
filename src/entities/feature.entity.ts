import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Match } from 'src/entities/match.entity';
import { uuid } from 'src/shared/types/uuid.type';

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
