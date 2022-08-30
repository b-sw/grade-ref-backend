import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/modules/users/users.module';
import { MatchesController } from 'src/modules/matches/matches.controller';
import { AWSModule } from 'src/modules/aws/aws.module';
import { MatchesService } from 'src/modules/matches/matches.service';
import { LeaguesModule } from 'src/modules/leagues/leagues.module';
import { TeamsModule } from 'src/modules/teams/teams.module';
import { Match } from 'src/entities/match.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Match]), LeaguesModule, forwardRef(() => UsersModule), TeamsModule, AWSModule],
    controllers: [MatchesController],
    providers: [MatchesService],
    exports: [MatchesService],
})
export class MatchesModule {}
