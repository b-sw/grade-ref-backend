import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { User } from './src/entities/user.entity';
import { config } from 'dotenv';
import { Team } from './src/entities/team.entity';
import { Match } from './src/entities/match.entity';
import { League } from './src/entities/league.entity';

config();
/*
  Be careful!
    "synchronize: true" should only be used for early development.
    It causes db schema to sync if it detects there's a mismatch between db schema and entities.
    This behaviour may lead to an automatic table drop.
 */
const entities = [User, Team, Match, League];

export const dbConfig: MysqlConnectionOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: entities,
  synchronize: true,
};

export const e2eConfig: SqliteConnectionOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: entities,
  synchronize: true,
};
