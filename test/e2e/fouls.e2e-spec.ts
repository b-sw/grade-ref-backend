import { getRepository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { League } from '../../src/entities/league.entity';
import { Team } from '../../src/entities/team.entity';
import { Match } from '../../src/entities/match.entity';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { MockUser } from '../shared/mockUser';
import { v4 as randomUuid } from 'uuid';
import { MockLeague } from '../shared/mockLeague';
import { MockTeam } from '../shared/mockTeam';
import * as jwt from 'jsonwebtoken';
import { MockMatch, setMockMatchDatetime } from '../shared/mockMatch';
import request from 'supertest';
import { CreateFoulDto } from '../../src/fouls/dto/create-foul.dto';
import { MockCreateFoulDto } from '../shared/mockFoul';
import { Foul } from '../../src/entities/foul.entity';
import { UpdateFoulDto } from '../../src/fouls/dto/update-foul.dto';
import dayjs from 'dayjs';
import { UpdateMatchDto } from '../../src/matches/dto/update-match.dto';
import { MATCH_DURATION, OVERALL_GRADE_ENTRY_TIME_WINDOW } from '../../src/matches/matches.service';
import { Role } from '../../src/users/constants/users.constants';

describe('e2e fouls', () => {
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

  let mockFoul: Partial<Foul>;
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
    await matchRepository.save(mockMatch);

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
    await getRepository(Foul).clear();
  });

  it('should not create foul for not observer', async () => {
    const dto: CreateFoulDto = MockCreateFoulDto(teamA.id);

    await Promise.all([adminAccessToken, refereeAccessToken].map(async (token) => {
      const response = await request(app.getHttpServer())
        .post(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/fouls`)
        .auth(token, { type: 'bearer' })
        .send(dto);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    }));
  });

  it('should create foul', async () => {
    const dto: CreateFoulDto = MockCreateFoulDto(teamA.id);

    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/fouls`)
      .auth(observerAccessToken, { type: 'bearer' })
      .send(dto);

    mockFoul = {
      ...dto,
      id: response.body.id,
      matchId: response.body.matchId
    };

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(mockFoul);

    const foul: Foul | undefined = await getRepository(Foul).findOne({ where: { id: mockFoul.id } });
    expect(foul).toMatchObject(mockFoul);
  });

  it('should not get foul for invalid user', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/fouls/${mockFoul.id}`)
      .auth(referee2AccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should get foul', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/fouls/${mockFoul.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(mockFoul);

    const foul: Foul | undefined = await getRepository(Foul).findOne({ where: { id: mockFoul.id } });
    expect(foul).toMatchObject(mockFoul);
  });

  it('should not get match fouls for invalid user', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/fouls`)
      .auth(referee2AccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should get match fouls', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/fouls`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject([mockFoul]);

    const fouls: Foul[] = await getRepository(Foul).find({ where: { matchId: mockMatch.id } });
    expect(fouls.length).toBe(1);
    expect(fouls[0]).toMatchObject(mockFoul);
  });

  it('should not update foul for not observer', async () => {
    const dto: UpdateFoulDto = MockCreateFoulDto(teamB.id);

    await Promise.all([adminAccessToken, refereeAccessToken].map(async (token) => {
      const response = await request(app.getHttpServer())
        .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/fouls/${mockFoul.id}`)
        .auth(token, { type: 'bearer' })
        .send(dto);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    }));
  });

  it('should update foul', async () => {
    const dto: UpdateFoulDto = MockCreateFoulDto(teamB.id);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/fouls/${mockFoul.id}`)
      .auth(observerAccessToken, { type: 'bearer' })
      .send(dto);

    mockFoul.teamId = teamB.id;

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(mockFoul);

    const foul: Foul | undefined = await getRepository(Foul).findOne({ where: { id: mockFoul.id } });
    expect(foul).toMatchObject(mockFoul);
  });

  it('should not update foul if late', async () => {
    await setMockMatchDatetime(mockMatch.id, dayjs().subtract(8, 'day'));
    const dto: UpdateMatchDto = { overallGrade: 'Mock overall grade.' } as UpdateMatchDto;

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/overallGrade`)
      .auth(observerAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe(`Time window of ${OVERALL_GRADE_ENTRY_TIME_WINDOW - MATCH_DURATION} hours for this entry has passed.`);

    await setMockMatchDatetime(mockMatch.id, dayjs().add(2, 'day'));
  });

  it('should not remove foul for not observer', async () => {
    await Promise.all([adminAccessToken, refereeAccessToken].map(async (token) => {
      const response = await request(app.getHttpServer())
        .delete(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/fouls/${mockFoul.id}`)
        .auth(token, { type: 'bearer' });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    }));
  });

  it('should remove foul', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/fouls/${mockFoul.id}`)
      .auth(observerAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(mockFoul);

    const foul: Foul = await getRepository(Foul).findOne({ where: { id: mockFoul.id } });
    expect(foul).toBeUndefined();
  });
});