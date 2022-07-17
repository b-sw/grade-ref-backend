import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbConfig, e2eConfig } from '../ormconfig';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { MatchesModule } from './matches/matches.module';
import { LeaguesModule } from './leagues/leagues.module';
import { HealthModule } from './health/health.module';
import { FoulsModule } from './fouls/fouls.module';
import { FeaturesModule } from './features/features.module';
import { AWSModule } from './aws/aws.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(process.env.NODE_ENV === 'test' ? e2eConfig : dbConfig),
    UsersModule,
    AuthModule,
    TeamsModule,
    MatchesModule,
    LeaguesModule,
    HealthModule,
    FoulsModule,
    FeaturesModule,
    AWSModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
