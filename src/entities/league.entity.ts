import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { uuid } from 'src/shared/types/uuid.type';

@Entity()
export class League {
    @PrimaryGeneratedColumn('uuid')
    id: uuid;

    @Column({ unique: true })
    name: string;

    @Column({ unique: true })
    shortName: string;

    @Column()
    country: string;

    @ManyToMany(() => User, { cascade: true, onDelete: 'CASCADE' /*, eager: true*/ })
    @JoinTable()
    observers: User[];

    @ManyToMany(() => User, { cascade: true, onDelete: 'CASCADE' /*, eager: true*/ })
    @JoinTable()
    referees: User[];

    @ManyToMany(() => User, { cascade: true, onDelete: 'CASCADE' /*, eager: true*/ })
    @JoinTable()
    admins: User[];
}
