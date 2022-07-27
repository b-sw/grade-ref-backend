import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { User } from '../../src/entities/user.entity';
import { MockUser } from '../shared/mockUser';
import { getRepository } from 'typeorm';
import { League } from '../../src/entities/league.entity';
import { Team } from '../../src/entities/team.entity';
import { MockLeague } from '../shared/mockLeague';
import { MockCreateTeamDto } from '../shared/mockTeam';
import request from 'supertest';
import { Role } from '../../src/domains/users/constants/users.constants';
import { getSignedJwt } from '../shared/jwt';

describe('e2e teams', () => {
  const owner = MockUser({ role: Role.Owner, email: 'mock@mail.com', lastName: 'Doe' });
  const admin = MockUser({ role: Role.Admin, email: 'admin@mail.com', lastName: 'Doe1' });
  const referee = MockUser({ role: Role.Referee, email: 'ref@mail.com', lastName: 'Doe2' });
  const observer = MockUser({ role: Role.Observer, email: 'obs@mail.com', lastName: 'Doe3' });
  const league = MockLeague({
    admins: [admin],
    referees: [referee],
    observers: [observer],
  });
  const users = [owner, admin, referee, observer];

  let ownerJWT: string;
  let adminJWT: string;
  let refereeJWT: string;
  let observerJWT: string;
  let team: Partial<Team>;
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const usersRepository = await getRepository(User);
    await Promise.all(users.map(async (user) => await usersRepository.save(user)));
    const leagueRepository = await getRepository(League);
    await leagueRepository.save(league);

    ownerJWT = getSignedJwt(owner);
    adminJWT = getSignedJwt(admin);
    refereeJWT = getSignedJwt(referee);
    observerJWT = getSignedJwt(observer);
  });

  afterAll(async () => {
    await getRepository(User).clear();
    await getRepository(League).clear();
    await getRepository(Team).clear();
  });

  it('should create team for admin', async () => {
    const dto = MockCreateTeamDto({});

    const response = await request(app.getHttpServer())
      .post(`/leagues/${league.id}/teams`)
      .auth(adminJWT, { type: 'bearer' })
      .send(dto);

    team = { ...dto, id: expect.any(String), leagueId: expect.any(String) };

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(team);

    team.id = response.body.id;
    team.leagueId = response.body.leagueId;

    const teams = await getRepository(Team).find();
    expect(teams).toHaveLength(1);
    expect(teams[0]).toMatchObject(team);
  });

  it('should not create team for not league admin', async () => {
    const dto = MockCreateTeamDto({});

    await Promise.all(
      [refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .post(`/leagues/${league.id}/teams`)
          .auth(token, { type: 'bearer' })
          .send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should update team for league admin', async () => {
    const dto = MockCreateTeamDto({ name: 'FC Mock team Updated' });

    const response = await request(app.getHttpServer())
      .put(`/leagues/${league.id}/teams/${team.id}`)
      .auth(adminJWT, { type: 'bearer' })
      .send(dto);

    team = { ...team, name: dto.name };

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(team);

    const teams: Team[] = await getRepository(Team).find();
    expect(teams).toHaveLength(1);
    expect(teams[0]).toMatchObject(team);
  });

  it('should not update team for not league admin', async () => {
    const dto = MockCreateTeamDto({ name: 'FC Mock team Updated' });

    await Promise.all(
      [refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .put(`/leagues/${league.id}/teams/${team.id}`)
          .auth(token, { type: 'bearer' })
          .send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should get all teams for owner', async () => {
    const response = await request(app.getHttpServer()).get('/teams').auth(ownerJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject(team);
  });

  it('should not get all teams for not owner', async () => {
    await Promise.all(
      [adminJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer()).get('/teams').auth(token, { type: 'bearer' });

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should get all teams in a league for league user', async () => {
    await Promise.all(
      [adminJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .get(`/leagues/${league.id}/teams`)
          .auth(token, { type: 'bearer' });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject(team);
      }),
    );
  });

  it('should not get all teams in a league for not app user', async () => {
    const response = await request(app.getHttpServer()).get(`/leagues/${league.id}/teams`);
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should not delete team for not league admin', async () => {
    await Promise.all(
      [refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .delete(`/leagues/${league.id}/teams/${team.id}`)
          .auth(token, { type: 'bearer' });

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should delete team for league admin', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${league.id}/teams/${team.id}`)
      .auth(adminJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(team);

    const teams: Team[] = await getRepository(Team).find();
    expect(teams).toHaveLength(0);
  });
});
