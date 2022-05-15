import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/shared/types/role';
import { getRepository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { MockUser } from '../shared/MockUser';
import { v4 as randomUuid } from 'uuid';
import * as request from 'supertest';

describe('e2e leagues', () => {
  const mockOwner: User = MockUser({ id: randomUuid(), role: Role.Owner, email: 'mock@mail.com' });
  const mockAdmin: User = MockUser( { id: randomUuid(), role: Role.Admin, email: 'admin@mail.com' });
  const mockReferee: User = MockUser( { id: randomUuid(), role: Role.Referee, email: 'ref@mail.com' });
  const mockObserver: User = MockUser( { id: randomUuid(), role: Role.Observer, email: 'obs@mail.com' });
  const users: User[] = [mockOwner, mockAdmin, mockReferee, mockObserver];

  let app: INestApplication;
  let ownerAccessToken: string;
  let adminAccessToken: string;
  let observerAccessToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const usersRepository = await getRepository(User);
    await Promise.all(users.map(async (user) => await usersRepository.insert(user)));

    ownerAccessToken = jwt.sign({ email: mockOwner.email, sub: mockOwner.id }, process.env.JWT_SECRET);
    adminAccessToken = jwt.sign({ email: mockAdmin.email, sub: mockAdmin.id }, process.env.JWT_SECRET);
    observerAccessToken = jwt.sign({ email: mockObserver.email, sub: mockObserver.id }, process.env.JWT_SECRET);
  });

  it('should create league', async () => {

  });

  it('should not create league', async () => {

  });

  it('should get admin leagues', async () => {

  });

  it('should get referee leagues', async () => {

  });

  it('should get observer leagues', async () => {

  });

  it('should get league', async () => {

  });

  it('should not get league', async () => {

  });

  it('should update league', async () => {

  });

  it('should not update league', async () => {

  });

  it('should delete league', async () => {

  });

  it('should not delete league', async () => {

  });
});
