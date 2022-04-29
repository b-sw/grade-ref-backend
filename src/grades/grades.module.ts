import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from '../entities/grade.entity';
import { UsersModule } from '../users/users.module';
import { MatchesModule } from '../matches/matches.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Grade]),
    AuthModule,
    UsersModule,
    MatchesModule
  ],
  controllers: [GradesController],
  providers: [GradesService]
})
export class GradesModule {}
