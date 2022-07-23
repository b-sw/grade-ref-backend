import { getRepository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { League } from '../../src/entities/league.entity';
import { Team } from '../../src/entities/team.entity';
import { Match } from '../../src/entities/match.entity';
import { MockUser } from '../shared/mockUser';
import { v4 as randomUuid } from 'uuid';
import { MockLeague } from '../shared/mockLeague';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { CreateMatchDto } from '../../src/matches/dto/create-match.dto';
import request from 'supertest';
import { MockCreateMatchDto, setMockMatchDatetime } from '../shared/mockMatch';
import { MockTeam } from '../shared/mockTeam';
import { UpdateMatchDto } from 'src/matches/dto/update-match.dto';
import dayjs from 'dayjs';
import {
  GRADE_ENTRY_TIME_WINDOW,
  MATCH_DURATION,
  OVERALL_GRADE_ENTRY_TIME_WINDOW,
} from '../../src/matches/matches.service';
import { ReportType } from '../../src/matches/constants/matches.constants';
import { Role } from '../../src/users/constants/users.constants';
import { getSignedJwt } from '../shared/jwt';

describe('e2e matches', () => {
  const mockOwner: User = MockUser({ id: randomUuid(), role: Role.Owner, email: 'mock@mail.com', lastName: 'Doe' });
  const mockAdmin: User = MockUser({ id: randomUuid(), role: Role.Admin, email: 'admin@mail.com', lastName: 'Doe1' });
  const mockAdminB: User = MockUser({ id: randomUuid(), role: Role.Admin, email: 'adminB@mail.com', lastName: 'Doe1a' });
  const mockReferee: User = MockUser({ id: randomUuid(), role: Role.Referee, email: 'ref@mail.com', lastName: 'Doe2' });
  const mockRefereeB: User = MockUser({
    id: randomUuid(),
    role: Role.Referee,
    email: 'ref2@mail.com',
    lastName: 'Doe2a',
  });
  const mockObserver: User = MockUser({
    id: randomUuid(),
    role: Role.Observer,
    email: 'obs@mail.com',
    phoneNumber: '669797907',
    lastName: 'Doe3',
  });
  const mockObserverB: User = MockUser({
    id: randomUuid(),
    role: Role.Observer,
    email: 'obsB@mail.com',
    lastName: 'Doe3a',
  });
  const mockLeague: League = MockLeague({
    admins: [mockAdmin],
    referees: [mockReferee],
    observers: [mockObserver, mockObserverB]
  });
  const users: User[] = [mockOwner, mockAdmin, mockAdminB, mockReferee, mockRefereeB, mockObserver, mockObserverB];

  const teamA: Team = MockTeam(mockLeague.id, mockLeague, 'FC Team A');
  const teamB: Team = MockTeam(mockLeague.id, mockLeague, 'FC Team B');

  let mockMatch: Partial<Match>;
  let ownerToken: string;
  let adminToken: string;
  let otherLeagueAdminToken: string;
  let refereeToken: string;
  let refereeBToken: string;
  let observerToken: string;
  let observerBToken: string;
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
    await teamRepository.save(teamA);
    await teamRepository.save(teamB);

    ownerToken = getSignedJwt(mockOwner);
    adminToken = getSignedJwt(mockAdmin);
    otherLeagueAdminToken = getSignedJwt(mockAdminB);
    refereeToken = getSignedJwt(mockReferee);
    refereeBToken = getSignedJwt(mockRefereeB);
    observerToken = getSignedJwt(mockObserver);
    observerBToken = getSignedJwt(mockObserverB);
  });

  afterAll(async () => {
    await getRepository(User).clear();
    await getRepository(League).clear();
    await getRepository(Team).clear();
    await getRepository(Match).clear();
  });

  it('should not create match', async () => {
    const dto: CreateMatchDto = MockCreateMatchDto(teamA, teamB, mockReferee, mockObserver);

    await Promise.all(
      [observerToken, refereeToken].map(async (token) => {
        const response = await request(app.getHttpServer())
          .post(`/leagues/${mockLeague.id}/matches`)
          .auth(token, { type: 'bearer' })
          .send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should create match', async () => {
    const dto: CreateMatchDto = MockCreateMatchDto(teamA, teamB, mockReferee, mockObserver);

    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/matches`)
      .auth(adminToken, { type: 'bearer' })
      .send(dto);

    mockMatch = {
      ...dto,
      id: expect.any(String),
      userReadableKey: expect.any(String),
      leagueId: mockLeague.id,
      observerSmsId: expect.any(String),
    };
    response.body.matchDate = new Date(response.body.matchDate);

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(mockMatch);

    mockMatch.id = response.body.id;
    mockMatch.userReadableKey = response.body.userReadableKey;
    mockMatch.observerSmsId = response.body.observerSmsId;

    const match: Match = await getRepository(Match).findOne({ where: { id: mockMatch.id } });
    expect(match).toMatchObject(mockMatch);
  });

  it('should not update match for referee request', async () => {
    const dto: UpdateMatchDto = MockCreateMatchDto(teamB, teamA, mockReferee, mockObserver);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}`)
      .auth(refereeToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not update match with invalid assignment', async () => {
    mockMatch.refereeId = mockRefereeB.id;
    const dto: UpdateMatchDto = MockCreateMatchDto(teamB, teamA, mockRefereeB, mockObserver);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}`)
      .auth(adminToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should update match', async () => {
    const dto: UpdateMatchDto = MockCreateMatchDto(teamB, teamA, mockRefereeB, mockObserver);
    const league: League = await getRepository(League).findOne({
      where: { id: mockLeague.id },
      relations: ['admins', 'referees', 'observers'],
    });
    league.referees.push(mockRefereeB);
    await getRepository(League).save(league);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}`)
      .auth(adminToken, { type: 'bearer' })
      .send(dto);

    response.body.matchDate = new Date(response.body.matchDate);
    mockMatch = { ...mockMatch, homeTeamId: teamB.id, awayTeamId: teamA.id, matchDate: expect.any(Date) }
    mockMatch.userReadableKey = response.body.userReadableKey;
    mockMatch.observerSmsId = response.body.observerSmsId;

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(mockMatch);

    const match: Match = await getRepository(Match).findOne({ where: { id: mockMatch.id } });
    expect(match).toMatchObject(mockMatch);
  });

  it('should not get all matches in a league', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches`)
      .auth(refereeToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should get all matches in a league', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches`)
      .auth(adminToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    response.body[0].matchDate = new Date(response.body[0].matchDate);
    expect(response.body).toMatchObject([mockMatch]);

    const matches: Match[] = await getRepository(Match).find({ where: { leagueId: mockLeague.id } });
    expect(response.body).toMatchObject(matches);
  });

  it.each([
    [Role.Admin],
    [Role.Referee],
    [Role.Observer],
  ])('should get league match for match %s', async (role) => {
    const tokens = {
      [Role.Admin]: adminToken,
      [Role.Referee]: refereeBToken,
      [Role.Observer]: observerToken,
    };

    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches/${mockMatch.id}`)
      .auth(tokens[role], { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    response.body.matchDate = new Date(response.body.matchDate);
    expect(response.body).toMatchObject(mockMatch);

    const match: Match = await getRepository(Match).findOne({ where: { id: mockMatch.id } });
    expect(response.body).toMatchObject(match);
  });

  it.each([
    [Role.Admin],
    [Role.Referee],
    [Role.Observer],
  ])('should not get league match for other match $role', async (role) => {
    const tokens = {
      [Role.Admin]: otherLeagueAdminToken,
      [Role.Referee]: refereeToken,
      [Role.Observer]: observerBToken,
    };
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches/${mockMatch.id}`)
      .auth(tokens[role], { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not get observer matches if not self', async () => {
    await Promise.all([adminToken, refereeToken].map(async (token) => {
      const response = await request(app.getHttpServer())
        .get(`/users/${mockObserver.id}/matches`)
        .auth(token, { type: 'bearer' });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    }));
  });

  it('should get observer matches for self', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${mockObserver.id}/matches`)
      .auth(observerToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    response.body[0].matchDate = new Date(response.body[0].matchDate);
    expect(response.body).toMatchObject([mockMatch]);

    const matches: Match[] = await getRepository(Match).find({ where: { observerId: mockObserver.id } });
    expect(response.body).toMatchObject(matches);
  });

  it('should get referee matches', async () => {
    refereeToken = getSignedJwt(mockRefereeB);

    const response = await request(app.getHttpServer())
      .get(`/users/${mockRefereeB.id}/matches`)
      .auth(refereeToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    response.body[0].matchDate = new Date(response.body[0].matchDate);
    expect(response.body).toMatchObject([mockMatch]);

    const matches: Match[] = await getRepository(Match).find({ where: { refereeId: mockRefereeB.id } });
    expect(response.body).toMatchObject(matches);
  });

  it('should update referee match grade', async () => {
    const dto: UpdateMatchDto = { refereeGrade: 5.5 } as UpdateMatchDto;

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/grade`)
      .auth(observerToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.OK);
    response.body.matchDate = new Date(response.body.matchDate);
    response.body.refereeGradeDate = new Date(response.body.refereeGradeDate);
    mockMatch = { ...mockMatch, refereeGrade: 5.5, refereeGradeDate: expect.any(Date) };
    expect(response.body).toMatchObject(mockMatch);

    const match: Match = await getRepository(Match).findOne({ where: { id: mockMatch.id } });
    expect(response.body).toMatchObject(match);
  });

  it('should not update referee match grade if not observer or league admin', async () => {
    await Promise.all([refereeToken].map(async (token) => {
      const dto: UpdateMatchDto = { refereeGrade: 5.5 } as UpdateMatchDto;

      const response = await request(app.getHttpServer())
        .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/grade`)
        .auth(token, { type: 'bearer' })
        .send(dto);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    }))
  });

  it('should not update referee match grade if late', async () => {
    await setMockMatchDatetime(mockMatch.id, dayjs().subtract(4, 'day'));
    const dto: UpdateMatchDto = { refereeGrade: 5.5 } as UpdateMatchDto;

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/grade`)
      .auth(observerToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe(`Time window of ${GRADE_ENTRY_TIME_WINDOW - MATCH_DURATION} hours for this entry has passed.`);
    await setMockMatchDatetime(mockMatch.id, dayjs().add(2, 'day'));
  });

  it('should not update referee overall grade if not observer or league admin', async () => {
    await Promise.all([otherLeagueAdminToken, refereeToken].map(async (token) => {
      const dto: UpdateMatchDto = { overallGrade: 'Mock overall grade.' } as UpdateMatchDto;

      const response = await request(app.getHttpServer())
        .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/overallGrade`)
        .auth(token, { type: 'bearer' })
        .send(dto);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    }))
  });

  it('should update referee overall grade', async () => {
    const dto: UpdateMatchDto = { overallGrade: 'Mock overall grade.' } as UpdateMatchDto;

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/overallGrade`)
      .auth(observerToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.OK);
    response.body.matchDate = new Date(response.body.matchDate);
    response.body.refereeGradeDate = new Date(response.body.refereeGradeDate);
    response.body.overallGradeDate = new Date(response.body.overallGradeDate);
    mockMatch = { ...mockMatch, overallGrade: dto.overallGrade, overallGradeDate: expect.any(Date) };
    expect(response.body).toMatchObject(mockMatch);

    const match: Match = await getRepository(Match).findOne({ where: { id: mockMatch.id } });
    expect(response.body).toMatchObject(match);
  });

  it('should not update referee overall grade if late', async () => {
    await setMockMatchDatetime(mockMatch.id, dayjs().subtract(8, 'day'));
    const dto: UpdateMatchDto = { overallGrade: 'Mock overall grade.' } as UpdateMatchDto;

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/overallGrade`)
      .auth(observerToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe(`Time window of ${OVERALL_GRADE_ENTRY_TIME_WINDOW - MATCH_DURATION} hours for this entry has passed.`);

    await setMockMatchDatetime(mockMatch.id, dayjs().add(2, 'day'));
  });

  it('should not delete match', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/matches/${mockMatch.id}`)
      .auth(refereeToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it.each`
    role             | forbiddenResourceTypes
    ${Role.Owner}    | ${[ReportType.Mentor, ReportType.Tv, ReportType.Observer]}
    ${Role.Admin}    | ${[ReportType.Mentor, ReportType.Tv, ReportType.Observer]}
    ${Role.Referee}  | ${[ReportType.Observer]}
    ${Role.Observer} | ${[ReportType.Tv, ReportType.Mentor]}
  `('should not let $role upload $forbiddenResourceTypes reports', async ({ role, forbiddenResourceTypes }) => {
    const tokens = {
      [Role.Admin]: adminToken,
      [Role.Owner]: ownerToken,
      [Role.Referee]: refereeToken,
      [Role.Observer]: observerToken,
    };

    await Promise.all(
      forbiddenResourceTypes.map(async (reportType) => {
        const response = await request(app.getHttpServer())
          .post(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/reports/${reportType}`)
          .auth(tokens[role], { type: 'bearer' })
          .send();

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it.each`
    role             | forbiddenResourceTypes
    ${Role.Observer} | ${[ReportType.Tv, ReportType.Mentor]}
  `('should not let $role download $forbiddenResourceTypes reports', async ({ role, forbiddenResourceTypes }) => {
    const tokens = {
      [Role.Admin]: adminToken,
      [Role.Owner]: ownerToken,
      [Role.Referee]: refereeToken,
      [Role.Observer]: observerToken,
    };

    await Promise.all(
      forbiddenResourceTypes.map(async (reportType) => {
        const response = await request(app.getHttpServer())
          .post(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/reports/${reportType}`)
          .auth(tokens[role], { type: 'bearer' })
          .send();

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it.each`
    role             | forbiddenResourceTypes
    ${Role.Owner}    | ${[ReportType.Mentor, ReportType.Tv, ReportType.Observer]}
    ${Role.Admin}    | ${[ReportType.Mentor, ReportType.Tv, ReportType.Observer]}
    ${Role.Referee}  | ${[ReportType.Observer]}
    ${Role.Observer} | ${[ReportType.Tv, ReportType.Mentor]}
  `('should not let $role remove $forbiddenResourceTypes reports', async ({ role, forbiddenResourceTypes }) => {
    const tokens = {
      [Role.Admin]: adminToken,
      [Role.Owner]: ownerToken,
      [Role.Referee]: refereeToken,
      [Role.Observer]: observerToken,
    };

    await Promise.all(
      forbiddenResourceTypes.map(async (reportType) => {
        const response = await request(app.getHttpServer())
          .delete(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/reports/${reportType}`)
          .auth(tokens[role], { type: 'bearer' })
          .send();

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should delete match', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/matches/${mockMatch.id}`)
      .auth(adminToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    response.body.matchDate = new Date(response.body.matchDate);
    response.body.refereeGradeDate = new Date(response.body.refereeGradeDate);
    response.body.overallGradeDate = new Date(response.body.overallGradeDate);
    expect(response.body).toMatchObject(mockMatch);

    const match: Match = await getRepository(Match).findOne({ where: { id: mockMatch.id } });
    expect(match).toBeUndefined();
  });
});
