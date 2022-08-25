import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from 'src/modules/users/users.service';
import { UsersController } from 'src/modules/users/users.controller';
import { User } from 'src/entities/user.entity';
import { LeaguesModule } from 'src/modules/leagues/leagues.module';
import { MatchesModule } from 'src/modules/matches/matches.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => LeaguesModule), forwardRef(() => MatchesModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
