import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { uuid } from '../types/uuid';

@Entity()
export class League {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column()
  name: string;

  @Column()
  shortName: string;

  @Column()
  country: string;
}
