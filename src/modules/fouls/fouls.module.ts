import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Foul } from 'src/entities/foul.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { FoulsController } from 'src/modules/fouls/fouls.controller';
import { LeaguesModule } from 'src/modules/leagues/leagues.module';
import { FoulsService } from 'src/modules/fouls/fouls.service';
import { MatchesModule } from 'src/modules/matches/matches.module';

@Module({
  imports: [TypeOrmModule.forFeature([Foul]), UsersModule, MatchesModule, LeaguesModule],
  controllers: [FoulsController],
  providers: [FoulsService],
  exports: [FoulsService],
})
export class FoulsModule {}
