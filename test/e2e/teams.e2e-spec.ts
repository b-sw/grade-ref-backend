import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { User } from '../../src/entities/user.entity';
import { MockUser } from '../shared/mockUser';
import { v4 as randomUuid } from 'uuid';
import { Role } from '../../src/shared/types/role';
import { getRepository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { League } from '../../src/entities/league.entity';
import { Team } from '../../src/entities/team.entity';
import { MockLeague } from '../shared/mockLeague';
import { CreateTeamDto } from '../../src/teams/dto/create-team.dto';
import { MockCreateTeamDto } from '../shared/mockTeam';
import * as request from 'supertest';
import { UpdateTeamDto } from '../../src/teams/dto/update-team.dto';

describe('e2e teams', () => {
  const mockOwner: User = MockUser({ id: randomUuid(), role: Role.Owner, email: 'mock@mail.com' });
  const mockAdmin: User = MockUser( { id: randomUuid(), role: Role.Admin, email: 'admin@mail.com' });
  const mockReferee: User = MockUser( { id: randomUuid(), role: Role.Referee, email: 'ref@mail.com' });
  const mockLeague: League = MockLeague({});
  const users: User[] = [mockOwner, mockAdmin, mockReferee];

  let ownerAccessToken: string;
  let adminAccessToken: string;
  let refereeAccessToken: string;
  let team: Partial<Team>;
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const usersRepository = await getRepository(User);
    await Promise.all(users.map(async (user) => await usersRepository.insert(user)));
    const leagueRepository = await getRepository(League);
    await leagueRepository.insert(mockLeague);

    ownerAccessToken = jwt.sign({ email: mockOwner.email, sub: mockOwner.id }, process.env.JWT_SECRET);
    adminAccessToken = jwt.sign({ email: mockAdmin.email, sub: mockAdmin.id }, process.env.JWT_SECRET);
    refereeAccessToken = jwt.sign({ email: mockReferee.email, sub: mockReferee.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await getRepository(User).clear();
    await getRepository(League).clear();
    await getRepository(Team).clear();
  });

  it('should create team', async () => {
    const assignAdminResponse = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/admins/${mockAdmin.id}`)
      .auth(ownerAccessToken, { type: 'bearer' });

    expect(assignAdminResponse.status).toBe(HttpStatus.CREATED);

    const dto: CreateTeamDto = MockCreateTeamDto({});

    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/teams`)
      .auth(adminAccessToken, { type: 'bearer' })
      .send(dto);

    team = { ...dto, id: expect.any(String), leagueId: expect.any(String) };

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(team);

    team.id = response.body.id;
    team.leagueId = response.body.leagueId;

    const teams: Team[] = await getRepository(Team).find();
    expect(teams).toHaveLength(1);
    expect(teams[0]).toMatchObject(team);
  });

  it('should not create team', async () => {
    const dto: CreateTeamDto = MockCreateTeamDto({});

    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/teams`)
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should update team', async () => {
    const dto: UpdateTeamDto = MockCreateTeamDto({ name: 'FC Mock team Updated'});

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/teams/${team.id}`)
      .auth(adminAccessToken, { type: 'bearer' })
      .send(dto);

    team = { ...team, name: dto.name };

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(team);

    const teams: Team[] = await getRepository(Team).find();
    expect(teams).toHaveLength(1);
    expect(teams[0]).toMatchObject(team);
  });

  it('should not update team', async () => {
    const dto: UpdateTeamDto = MockCreateTeamDto({ name: 'FC Mock team Updated'});

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/teams/${team.id}`)
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should get all teams', async () => {
    const response = await request(app.getHttpServer())
      .get('/teams')
      .auth(ownerAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject(team);
  });

  it('should not get all teams', async () => {
    const response = await request(app.getHttpServer())
      .get('/teams')
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should get all teams in a league', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/teams`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject(team);
  });

  it('should not get all teams in a league', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/teams`);

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should not delete team', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/teams/${team.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should delete team', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/teams/${team.id}`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(team);

    const teams: Team[] = await getRepository(Team).find();
    expect(teams).toHaveLength(0);
  });
});