import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config, e2eConfig } from '../ormconfig';

@Module({
  imports: [
    TypeOrmModule.forRoot(process.env.NODE_ENV === 'test' ? e2eConfig : config),
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
