import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/modules/users/users.module';
import { FeaturesService } from 'src/modules/features/features.service';
import { LeaguesModule } from 'src/modules/leagues/leagues.module';
import { FeaturesController } from 'src/modules/features/features.controller';
import { Feature } from 'src/entities/feature.entity';
import { MatchesModule } from 'src/modules/matches/matches.module';

@Module({
  imports: [TypeOrmModule.forFeature([Feature]), UsersModule, MatchesModule, LeaguesModule],
  controllers: [FeaturesController],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class FeaturesModule {}
