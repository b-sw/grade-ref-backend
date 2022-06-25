import { Module } from '@nestjs/common';
import { FoulsService } from './fouls.service';
import { FoulsController } from './fouls.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Foul } from '../entities/foul.entity';
import { UsersModule } from '../users/users.module';
import { MatchesModule } from '../matches/matches.module';
import { LeaguesModule } from '../leagues/leagues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Foul]),
    UsersModule,
    MatchesModule,
    LeaguesModule,
  ],
  controllers: [FoulsController],
  providers: [FoulsService],
  exports: [FoulsService],
})
export class FoulsModule {}
