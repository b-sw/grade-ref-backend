import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../entities/match.entity';
import { UsersModule } from '../users/users.module';
import { LeaguesModule } from '../leagues/leagues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match]),
    UsersModule,
    LeaguesModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService]
})
export class MatchesModule {}
