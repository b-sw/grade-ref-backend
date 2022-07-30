import { Module } from '@nestjs/common';
import { UsersModule } from './domains/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import dbConfig, { e2eConfig } from '../ormconfig';
import { AuthModule } from './domains/auth/auth.module';
import { TeamsModule } from './domains/teams/teams.module';
import { MatchesModule } from './domains/matches/matches.module';
import { LeaguesModule } from './domains/leagues/leagues.module';
import { HealthModule } from './domains/health/health.module';
import { FoulsModule } from './domains/fouls/fouls.module';
import { FeaturesModule } from './domains/features/features.module';
import { AWSModule } from './domains/aws/aws.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forRoot(process.env.NODE_ENV === 'test' ? e2eConfig : dbConfig),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 60 * 100,
    }),
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [],
})
export class AppModule {}
