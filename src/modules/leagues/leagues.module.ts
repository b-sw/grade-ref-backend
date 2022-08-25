import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaguesService } from 'src/modules/leagues/leagues.service';
import { League } from 'src/entities/league.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { TeamsModule } from 'src/modules/teams/teams.module';
import { LeaguesController } from 'src/modules/leagues/leagues.controller';

@Module({
  imports: [TypeOrmModule.forFeature([League]), forwardRef(() => UsersModule), forwardRef(() => TeamsModule)],
  controllers: [LeaguesController],
  providers: [LeaguesService],
  exports: [LeaguesService],
})
export class LeaguesModule {}
