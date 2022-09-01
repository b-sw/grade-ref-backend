import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { uuid } from 'src/shared/types/uuid.type';
import { Type } from 'class-transformer';
import { Match } from 'src/entities/match.entity';

@Entity()
export class VideoClip {
    @PrimaryGeneratedColumn('uuid')
    id: uuid;

    @Column()
    name: string;

    @Column()
    matchId: uuid;

    @Column({ type: 'datetime', nullable: true })
    @Type(() => Date)
    uploadDate: Date;

    @Column()
    path: string;

    @ManyToOne(() => Match, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'matchId' })
    match: Match;
}
