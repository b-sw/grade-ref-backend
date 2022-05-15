import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../entities/user.entity';
import { LeaguesModule } from '../leagues/leagues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => LeaguesModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
