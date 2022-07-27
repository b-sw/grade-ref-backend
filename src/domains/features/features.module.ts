import { Module } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { FeaturesController } from './features.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { MatchesModule } from '../matches/matches.module';
import { LeaguesModule } from '../leagues/leagues.module';
import { Feature } from '../../entities/feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Feature]), UsersModule, MatchesModule, LeaguesModule],
  controllers: [FeaturesController],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class FeaturesModule {}
