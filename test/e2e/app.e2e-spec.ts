import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { uuid } from '../../src/shared/types/uuid';
import { AppModule } from '../../src/app.module';
import { v4 as randomUuid } from 'uuid';
import { LeaguesService } from '../../src/leagues/leagues.service';
import { UsersService } from '../../src/users/users.service';
import { Role } from '../../src/shared/types/role';
import { getRepository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import * as request from 'supertest';
import { UsersModule } from '../../src/users/users.module';
import { UsersController } from '../../src/users/users.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';

describe('e2e scenario', () => {
  const mockUser: User = {
    id: randomUuid(),
    email: 'mock@email.com',
    role: Role.Owner,
    phoneNumber: '+48 111 222 333',
    firstName: 'John',
    lastName: 'Doe'
  };

  let leaguesService: LeaguesService;
  let usersService: UsersService;

  let userId: uuid;
  let teamId: uuid;
  let matchId: uuid;
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        AppModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '1d' },
        })],
      providers: [JwtStrategy]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const jwtStrategy: JwtStrategy = moduleFixture.get(JwtStrategy);
    console.log(jwtStrategy);
    await getRepository(User).insert(mockUser);
  });

  it('should login user', async () => {
    console.log('access token is', accessToken);
  });

});
