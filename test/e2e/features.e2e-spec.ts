import { User } from '../../src/entities/user.entity';
import { MockUser } from '../shared/mockUser';
import { v4 as randomUuid } from 'uuid';
import { Role } from '../../src/shared/types/role';
import { League } from '../../src/entities/league.entity';
import { MockLeague } from '../shared/mockLeague';
import { Team } from '../../src/entities/team.entity';
import { MockTeam } from '../shared/mockTeam';
import { Match } from '../../src/entities/match.entity';
import { MockMatch } from '../shared/mockMatch';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Feature, FeatureType } from '../../src/entities/feature.entity';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { getRepository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { CreateFeatureDto } from '../../src/features/dto/create-feature.dto';
import { MockCreateFeatureDto } from '../shared/mockFeature';
import { UpdateFeatureDto } from '../../src/features/dto/update-feature.dto';

describe('e2e features', () => {
  const mockOwner: User = MockUser({ id: randomUuid(), role: Role.Owner, email: 'mock@mail.com', lastName: 'Doe' });
  const mockAdmin: User = MockUser( { id: randomUuid(), role: Role.Admin, email: 'admin@mail.com', lastName: 'Doe1' });
  const mockReferee: User = MockUser( { id: randomUuid(), role: Role.Referee, email: 'ref@mail.com', lastName: 'Doe2' });
  const mockReferee2: User = MockUser( { id: randomUuid(), role: Role.Referee, email: 'ref2@mail.com', lastName: 'Doe3' });
  const mockObserver: User = MockUser( { id: randomUuid(), role: Role.Observer, email: 'obs@mail.com', phoneNumber: '669797907', lastName: 'Doe4' });
  const mockLeague: League = MockLeague({ admins: [mockAdmin], referees: [mockReferee], observers: [mockObserver] });
  const users: User[] = [mockOwner, mockAdmin, mockReferee, mockReferee2, mockObserver];

  const teamA: Team = MockTeam(mockLeague.id, mockLeague, 'FC Team A');
  const teamB: Team = MockTeam(mockLeague.id, mockLeague, 'FC Team B');
  const mockMatch: Match = MockMatch(teamA, teamB, mockReferee, mockObserver, mockLeague);
  const mockMatch2: Match = MockMatch(teamB, teamA, mockReferee2, mockObserver, mockLeague);

  let mockFeature: Partial<Feature>;
  let mockFeature2: Partial<Feature>;
  let ownerAccessToken: string;
  let adminAccessToken: string;
  let refereeAccessToken: string;
  let referee2AccessToken: string;
  let observerAccessToken: string;
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
    await leagueRepository.save(mockLeague);

    const teamRepository = await getRepository(Team);
    await Promise.all([teamA, teamB].map(async (team: Team) => await teamRepository.save(team)));

    const matchRepository = await getRepository(Match);
    await Promise.all([mockMatch, mockMatch2].map(async (match: Match) => await matchRepository.save(match)));

    ownerAccessToken = jwt.sign({ email: mockOwner.email, sub: mockOwner.id }, process.env.JWT_SECRET);
    adminAccessToken = jwt.sign({ email: mockAdmin.email, sub: mockAdmin.id }, process.env.JWT_SECRET);
    refereeAccessToken = jwt.sign({ email: mockReferee.email, sub: mockReferee.id }, process.env.JWT_SECRET);
    referee2AccessToken = jwt.sign({ email: mockReferee2.email, sub: mockReferee2.id }, process.env.JWT_SECRET);
    observerAccessToken = jwt.sign({ email: mockObserver.email, sub: mockObserver.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await getRepository(User).clear();
    await getRepository(League).clear();
    await getRepository(Team).clear();
    await getRepository(Match).clear();
    await getRepository(Feature).clear();
  });

  it('should not create feature for not match referee', async () => {
    const dto: CreateFeatureDto = MockCreateFeatureDto(mockReferee.id);

    await Promise.all([adminAccessToken, observerAccessToken, referee2AccessToken].map(async (token) => {
      const response = await request(app.getHttpServer())
        .post(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/features`)
        .auth(token, { type: 'bearer' })
        .send(dto);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    }));
  });

  it('should create feature for referee', async () => {
    const dto: CreateFeatureDto = MockCreateFeatureDto(mockReferee.id);

    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/features`)
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    mockFeature = {
      ...dto,
      id: response.body.id,
    };

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(mockFeature);

    const feature: Feature | undefined = await getRepository(Feature).findOne({ where: { id: mockFeature.id } });
    expect(response.body).toMatchObject(feature);
  });

  it('should not create feature because of type limit', async () => {
    const featuresRepository = await getRepository(Feature);
    const dto: CreateFeatureDto = MockCreateFeatureDto(mockReferee.id);
    const feature2: Feature = { ...dto, id: randomUuid(), matchId: mockMatch.id} as Feature;
    const feature3: Feature = { ...dto, id: randomUuid(), matchId: mockMatch.id} as Feature;

    await Promise.all([feature2, feature3].map(async (feature: Feature) => await featuresRepository.save(feature)));

    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/features`)
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe(`You can create a maximum of 3 ${dto.type} features per match`);
    await Promise.all([feature2, feature3].map(async (feature: Feature) => await featuresRepository.delete(feature.id)));
  });

  it('should create feature of different type', async () => {
    const dto: CreateFeatureDto = MockCreateFeatureDto(mockReferee.id, FeatureType.Negative);

    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/features`)
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    mockFeature2 = {
      ...dto,
      id: response.body.id,
    };

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(mockFeature2);

    const feature: Feature | undefined = await getRepository(Feature).findOne({ where: { id: mockFeature2.id } });
    expect(response.body).toMatchObject(feature);
  });

  it('should not get feature for wrong match', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches/${mockMatch2.id}/features/${mockFeature.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not get feature for non-existing match', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches/mockMatchId/features/${mockFeature.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should not update feature for not match referee', async () => {
    const dto: UpdateFeatureDto = MockCreateFeatureDto(mockReferee.id, FeatureType.Negative);

    await Promise.all([adminAccessToken, observerAccessToken, referee2AccessToken].map(async (token) => {
      const response = await request(app.getHttpServer())
        .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/features/${mockFeature.id}`)
        .auth(token, { type: 'bearer' })
        .send(dto);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    }));
  });

  it('should not update feature for invalid match', async () => {
    const dto: UpdateFeatureDto = MockCreateFeatureDto(mockReferee.id, FeatureType.Negative);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch2.id}/features/${mockFeature.id}`)
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not update feature because of type limit', async () => {
    const featuresRepository = await getRepository(Feature);
    const dto: UpdateFeatureDto = MockCreateFeatureDto(mockReferee.id);
    const feature2: Feature = { ...dto, id: randomUuid(), matchId: mockMatch.id} as Feature;
    const feature3: Feature = { ...dto, id: randomUuid(), matchId: mockMatch.id} as Feature;

    await Promise.all([feature2, feature3].map(async (feature: Feature) => await featuresRepository.save(feature)));

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/features/${mockFeature.id}`)
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe(`You can create a maximum of 3 ${dto.type} features per match`);
    await Promise.all([feature2, feature3].map(async (feature: Feature) => await featuresRepository.delete(feature.id)));
  });

  it('should update feature for referee', async () => {
    const dto: UpdateFeatureDto = MockCreateFeatureDto(mockReferee.id, FeatureType.Positive);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/features/${mockFeature2.id}`)
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    mockFeature2 = {
      ...dto,
      id: response.body.id,
    }

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(mockFeature2);

    const feature: Feature | undefined = await getRepository(Feature).findOne({ where: { id: mockFeature2.id } });
    expect(response.body).toMatchObject(feature);
  });

  it('should not remove feature for non-existing match', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/matches/mockMatchId/features/${mockFeature.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should not remove feature for invalid match', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/matches/${mockMatch2.id}/features/${mockFeature.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not remove feature for not match referee', async () => {
    await Promise.all([adminAccessToken, observerAccessToken, referee2AccessToken].map(async (token) => {
      const response = await request(app.getHttpServer())
        .delete(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/features/${mockFeature.id}`)
        .auth(token, { type: 'bearer' });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    }));
  });

  it('should remove feature for referee', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/features/${mockFeature.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(mockFeature);

    const feature: Feature = await getRepository(Feature).findOne({ where: { id: mockFeature.id } });
    expect(feature).toBeUndefined();
  });
});