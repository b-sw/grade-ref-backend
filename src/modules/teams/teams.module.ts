import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsService } from 'src/modules/teams/teams.service';
import { UsersModule } from 'src/modules/users/users.module';
import { TeamsController } from 'src/modules/teams/teams.controller';
import { Team } from 'src/entities/team.entity';
import { LeaguesModule } from 'src/modules/leagues/leagues.module';

@Module({
    imports: [TypeOrmModule.forFeature([Team]), forwardRef(() => LeaguesModule), forwardRef(() => UsersModule)],
    controllers: [TeamsController],
    providers: [TeamsService],
    exports: [TeamsService],
})
export class TeamsModule {}
