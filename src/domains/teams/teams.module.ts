import { forwardRef, Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../../entities/team.entity';
import { LeaguesModule } from '../leagues/leagues.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Team]), forwardRef(() => LeaguesModule), forwardRef(() => UsersModule)],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
