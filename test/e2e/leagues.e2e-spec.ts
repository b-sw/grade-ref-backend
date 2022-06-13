import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/shared/types/role';
import { getRepository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { MockUser } from '../shared/mockUser';
import { v4 as randomUuid } from 'uuid';
import request from 'supertest';
import { CreateLeagueDto } from '../../src/leagues/dto/create-league.dto';
import { MockCreateLeagueDto } from '../shared/mockLeague';
import { League } from '../../src/entities/league.entity';
import { uuid } from '../../src/shared/types/uuid';
import { UpdateLeagueDto } from '../../src/leagues/dto/update-league.dto';

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
  let leagueId: uuid;
  let expectedLeague: League;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const usersRepository = await getRepository(User);
    await Promise.all(users.map(async (user) => await usersRepository.save(user)));

    ownerAccessToken = jwt.sign({ email: mockOwner.email, sub: mockOwner.id }, process.env.JWT_SECRET);
    adminAccessToken = jwt.sign({ email: mockAdmin.email, sub: mockAdmin.id }, process.env.JWT_SECRET);
    observerAccessToken = jwt.sign({ email: mockObserver.email, sub: mockObserver.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await getRepository(User).clear();
    await getRepository(League).clear();
  });

  it('should create league', async () => {
    const dto: CreateLeagueDto = MockCreateLeagueDto({});
    expectedLeague = { ...dto, id: expect.any(String), admins: [mockAdmin], referees: [], observers: [] };

    const response = await request(app.getHttpServer())
      .post('/leagues')
      .auth(adminAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(expectedLeague);

    leagueId = response.body.id;
    expectedLeague.id = leagueId;

    const leagues: League[] = await getRepository(League).find({ relations: ['admins', 'referees', 'observers'] });
    expect(leagues).toHaveLength(1);
    expect(leagues[0]).toMatchObject(expectedLeague);
  });

  it('should not create league', async () => {
    const dto: CreateLeagueDto = MockCreateLeagueDto({});

    const response = await request(app.getHttpServer())
      .post('/leagues')
      .auth(observerAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should get admin leagues', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${mockAdmin.id}/leagues`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);
  });

  it('should get referee leagues', async () => {
    const refResponse = await request(app.getHttpServer())
      .post(`/leagues/${leagueId}/referees/${mockReferee.id}`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(refResponse.status).toBe(HttpStatus.CREATED);
    expectedLeague.referees = [mockReferee];

    const response = await request(app.getHttpServer())
      .get(`/users/${mockReferee.id}/leagues`)
      .auth(ownerAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);
  });

  it('should get observer leagues', async () => {
    const obsResponse = await request(app.getHttpServer())
      .post(`/leagues/${leagueId}/observers/${mockObserver.id}`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(obsResponse.status).toBe(HttpStatus.CREATED);
    expectedLeague.observers = [mockObserver];

    const response = await request(app.getHttpServer())
      .get(`/users/${mockObserver.id}/leagues`)
      .auth(observerAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);
  });

  it('should get league', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${leagueId}`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(expectedLeague);
  });

  it('should not get league', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${leagueId}`)
      .auth(observerAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should update league', async () => {
    const dto: UpdateLeagueDto = MockCreateLeagueDto({ name: 'Mock League Updated' });

    const response = await request(app.getHttpServer())
      .put(`/leagues/${leagueId}`)
      .auth(adminAccessToken, { type: 'bearer' })
      .send(dto);

    expectedLeague.name = dto.name;

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(expectedLeague);

    const updatedLeague: League = await getRepository(League).findOne({
      where: { id: expectedLeague.id },
      relations: ['admins', 'referees', 'observers']
    });
    expect(updatedLeague).toMatchObject(expectedLeague);
  });

  it('should not update league', async () => {
    const dto: UpdateLeagueDto = MockCreateLeagueDto({ name: 'Mock League Updated' });

    const response = await request(app.getHttpServer())
      .put(`/leagues/${leagueId}`)
      .auth(observerAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not delete league', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${leagueId}`)
      .auth(observerAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should delete league', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${leagueId}`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(expectedLeague);

    const leagues: League[] = await getRepository(League).find();
    expect(leagues).toHaveLength(0);
  });
});
