import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { uuid } from '../types/uuid';

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: uuid;

  @Column()
  name: string;
}
