import { forwardRef, Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../entities/match.entity';
import { UsersModule } from '../users/users.module';
import { LeaguesModule } from '../leagues/leagues.module';
import { TeamsModule } from '../teams/teams.module';
import { AWSModule } from '../aws/aws.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), LeaguesModule, forwardRef(() => UsersModule), TeamsModule, AWSModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
