import { MockUser } from '../shared/mockUser';
import { v4 as randomUuid } from 'uuid';
import { MockLeague } from '../shared/mockLeague';
import { MockTeam } from '../shared/mockTeam';
import { MockMatch } from '../shared/mockMatch';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { getRepository } from 'typeorm';
import request from 'supertest';
import { MockCreateFeatureDto } from '../shared/mockFeature';
import { getSignedJwt } from '../shared/jwt';
import { Role } from 'src/modules/users/constants/users.constants';
import { Feature, FeatureType } from 'src/entities/feature.entity';
import { League } from 'src/entities/league.entity';
import { User } from 'src/entities/user.entity';
import { Team } from 'src/entities/team.entity';
import { Match } from 'src/entities/match.entity';

describe('e2e features', () => {
  const admin = MockUser({ role: Role.Admin, email: 'admin@mail.com', lastName: 'Doe1' });
  const refereeA = MockUser({ role: Role.Referee, email: 'ref@mail.com', lastName: 'Doe2' });
  const refereeB = MockUser({
    role: Role.Referee,
    email: 'ref2@mail.com',
    lastName: 'Doe3',
  });
  const observerA = MockUser({
    role: Role.Observer,
    email: 'obs@mail.com',
    phoneNumber: '669797907',
    lastName: 'Doe4',
  });
  const observerB = MockUser({
    role: Role.Observer,
    email: 'obs2@mail.com',
    lastName: 'Doe5',
  });
  const league = MockLeague({
    admins: [admin],
    referees: [refereeA],
    observers: [observerA, observerB],
  });
  const users = [admin, refereeA, refereeB, observerA, observerB];

  const teamA = MockTeam(league.id, league, 'FC Team A');
  const teamB = MockTeam(league.id, league, 'FC Team B');
  const matchA = MockMatch(teamA, teamB, refereeA, observerA, league);
  const matchB = MockMatch(teamB, teamA, refereeB, observerA, league);

  let mockFeatureA: Partial<Feature>;
  let mockFeatureB: Partial<Feature>;
  let adminJWT: string;
  let refereeAJWT: string;
  let refereeBJWT: string;
  let observerAJWT: string;
  let observerBJWT: string;
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const usersRepository = await getRepository(User);
    await Promise.all(users.map(async (user: User) => await usersRepository.save(user)));

    const leagueRepository = await getRepository(League);
    await leagueRepository.save(league);

    const teamRepository = await getRepository(Team);
    await Promise.all([teamA, teamB].map(async (team: Team) => await teamRepository.save(team)));

    const matchRepository = await getRepository(Match);
    await Promise.all([matchA, matchB].map(async (match: Match) => await matchRepository.save(match)));

    adminJWT = getSignedJwt(admin);
    refereeAJWT = getSignedJwt(refereeA);
    refereeBJWT = getSignedJwt(refereeB);
    observerAJWT = getSignedJwt(observerA);
    observerBJWT = getSignedJwt(observerB);
  });

  afterAll(async () => {
    await getRepository(User).clear();
    await getRepository(League).clear();
    await getRepository(Team).clear();
    await getRepository(Match).clear();
    await getRepository(Feature).clear();
  });

  it('should not create feature for not match observer', async () => {
    const dto = MockCreateFeatureDto();

    await Promise.all(
      [adminJWT, refereeAJWT, refereeBJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .post(`/leagues/${league.id}/matches/${matchA.id}/features`)
          .auth(token, { type: 'bearer' })
          .send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should create feature for match observer', async () => {
    const dto = MockCreateFeatureDto();

    const response = await request(app.getHttpServer())
      .post(`/leagues/${league.id}/matches/${matchA.id}/features`)
      .auth(observerAJWT, { type: 'bearer' })
      .send(dto);

    mockFeatureA = {
      ...dto,
      id: response.body.id,
    };

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(mockFeatureA);

    const feature: Feature | undefined = await getRepository(Feature).findOne({ where: { id: mockFeatureA.id } });
    expect(response.body).toMatchObject(feature);
  });

  it('should not create feature because of type limit', async () => {
    const featuresRepository = await getRepository(Feature);
    const dto = MockCreateFeatureDto();
    const feature2 = { ...dto, id: randomUuid(), matchId: matchA.id, refereeId: matchA.referee.id } as Feature;
    const feature3 = { ...dto, id: randomUuid(), matchId: matchA.id, refereeId: matchA.referee.id } as Feature;

    await Promise.all([feature2, feature3].map(async (feature: Feature) => await featuresRepository.save(feature)));

    const response = await request(app.getHttpServer())
      .post(`/leagues/${league.id}/matches/${matchA.id}/features`)
      .auth(observerAJWT, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe(`You can create a maximum of 3 ${dto.type} features per match`);
    await Promise.all(
      [feature2, feature3].map(async (feature: Feature) => await featuresRepository.delete(feature.id)),
    );
  });

  it('should create feature of different type', async () => {
    const dto = MockCreateFeatureDto(FeatureType.Negative);

    const response = await request(app.getHttpServer())
      .post(`/leagues/${league.id}/matches/${matchA.id}/features`)
      .auth(observerAJWT, { type: 'bearer' })
      .send(dto);

    mockFeatureB = {
      ...dto,
      id: response.body.id,
    };

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(mockFeatureB);

    const feature: Feature | undefined = await getRepository(Feature).findOne({ where: { id: mockFeatureB.id } });
    expect(response.body).toMatchObject(feature);
  });

  it('should not get feature for wrong match', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${league.id}/matches/${matchB.id}/features/${mockFeatureA.id}`)
      .auth(observerAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not get feature for non-existing match', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${league.id}/matches/mockMatchId/features/${mockFeatureA.id}`)
      .auth(observerAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should not update feature for not match observer', async () => {
    const dto = MockCreateFeatureDto(FeatureType.Negative);

    await Promise.all(
      [adminJWT, refereeAJWT, observerBJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .put(`/leagues/${league.id}/matches/${matchA.id}/features/${mockFeatureA.id}`)
          .auth(token, { type: 'bearer' })
          .send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should not update feature for invalid match', async () => {
    const dto = MockCreateFeatureDto(FeatureType.Negative);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${league.id}/matches/${matchB.id}/features/${mockFeatureA.id}`)
      .auth(observerAJWT, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not update feature because of type limit', async () => {
    const featuresRepository = await getRepository(Feature);
    const dto = MockCreateFeatureDto();
    const feature2 = { ...dto, id: randomUuid(), matchId: matchA.id, refereeId: matchA.referee.id } as Feature;
    const feature3 = { ...dto, id: randomUuid(), matchId: matchA.id, refereeId: matchA.referee.id } as Feature;

    await Promise.all([feature2, feature3].map(async (feature: Feature) => await featuresRepository.save(feature)));

    const response = await request(app.getHttpServer())
      .put(`/leagues/${league.id}/matches/${matchA.id}/features/${mockFeatureA.id}`)
      .auth(observerAJWT, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe(`You can create a maximum of 3 ${dto.type} features per match`);
    await Promise.all(
      [feature2, feature3].map(async (feature: Feature) => await featuresRepository.delete(feature.id)),
    );
  });

  it('should update feature for match observer', async () => {
    const dto = MockCreateFeatureDto(FeatureType.Positive);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${league.id}/matches/${matchA.id}/features/${mockFeatureB.id}`)
      .auth(observerAJWT, { type: 'bearer' })
      .send(dto);

    mockFeatureB = {
      ...dto,
      id: response.body.id,
    };

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(mockFeatureB);

    const feature: Feature | undefined = await getRepository(Feature).findOne({ where: { id: mockFeatureB.id } });
    expect(response.body).toMatchObject(feature);
  });

  it('should not remove feature for non-existing match', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${league.id}/matches/mockMatchId/features/${mockFeatureA.id}`)
      .auth(observerAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should not remove feature for invalid match', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${league.id}/matches/${matchB.id}/features/${mockFeatureA.id}`)
      .auth(observerAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not remove feature for not match observer', async () => {
    await Promise.all(
      [adminJWT, refereeAJWT, observerBJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .delete(`/leagues/${league.id}/matches/${matchA.id}/features/${mockFeatureA.id}`)
          .auth(token, { type: 'bearer' });

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should remove feature for match observer', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${league.id}/matches/${matchA.id}/features/${mockFeatureA.id}`)
      .auth(observerAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(mockFeatureA);

    const feature: Feature = await getRepository(Feature).findOne({ where: { id: mockFeatureA.id } });
    expect(feature).toBeUndefined();
  });
});
