import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/modules/users/users.module';
import { AWSModule } from 'src/modules/aws/aws.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { LeaguesModule } from 'src/modules/leagues/leagues.module';
import dbConfig, { e2eConfig } from '../ormconfig';
import { HealthModule } from 'src/modules/health/health.module';
import { FoulsModule } from 'src/modules/fouls/fouls.module';
import { FeaturesModule } from 'src/modules/features/features.module';
import { TeamsModule } from 'src/modules/teams/teams.module';
import { MatchesModule } from 'src/modules/matches/matches.module';

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
