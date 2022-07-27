import { getRepository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { League } from '../../src/entities/league.entity';
import { Team } from '../../src/entities/team.entity';
import { Match } from '../../src/entities/match.entity';
import { MockUser } from '../shared/mockUser';
import { MockLeague } from '../shared/mockLeague';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { MockCreateMatchDto, setMockMatchDatetime } from '../shared/mockMatch';
import { MockTeam } from '../shared/mockTeam';
import { UpdateMatchDto } from 'src/domains/matches/dto/update-match.dto';
import dayjs from 'dayjs';
import {
  GRADE_ENTRY_TIME_WINDOW,
  MATCH_DURATION,
  OVERALL_GRADE_ENTRY_TIME_WINDOW,
} from '../../src/domains/matches/matches.service';
import { ReportType } from '../../src/domains/matches/constants/matches.constants';
import { Role } from '../../src/domains/users/constants/users.constants';
import { getSignedJwt } from '../shared/jwt';
import { MatchInfo } from '../../src/domains/matches/types/match-info.type';

describe('e2e matches', () => {
  const owner = MockUser({ role: Role.Owner, email: 'mock@mail.com', lastName: 'Doe' });
  const adminA = MockUser({ role: Role.Admin, email: 'admin@mail.com', lastName: 'Doe1' });
  const adminB = MockUser({
    role: Role.Admin,
    email: 'adminB@mail.com',
    lastName: 'Doe1a',
  });
  const refereeA = MockUser({ role: Role.Referee, email: 'ref@mail.com', lastName: 'Doe2' });
  const refereeB = MockUser({
    role: Role.Referee,
    email: 'ref2@mail.com',
    lastName: 'Doe2a',
  });
  const observerA = MockUser({
    role: Role.Observer,
    email: 'obs@mail.com',
    phoneNumber: '669797907',
    lastName: 'Doe3',
  });
  const observerB = MockUser({
    role: Role.Observer,
    email: 'obsB@mail.com',
    lastName: 'Doe3a',
  });
  const league = MockLeague({
    admins: [adminA],
    referees: [refereeA],
    observers: [observerA, observerB],
  });
  const users = [owner, adminA, adminB, refereeA, refereeB, observerA, observerB];

  const teamA = MockTeam(league.id, league, 'FC Team A');
  const teamB = MockTeam(league.id, league, 'FC Team B');

  let match: Partial<Match>;
  let matchInfo: MatchInfo;
  let ownerJWT: string;
  let adminAJWT: string;
  let adminBJWT: string;
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
    await teamRepository.save(teamA);
    await teamRepository.save(teamB);

    ownerJWT = getSignedJwt(owner);
    adminAJWT = getSignedJwt(adminA);
    adminBJWT = getSignedJwt(adminB);
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
  });

  it('should not create match for not league admin', async () => {
    const dto = MockCreateMatchDto(teamA, teamB, refereeA, observerA);

    await Promise.all(
      [adminBJWT, observerAJWT, refereeAJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .post(`/leagues/${league.id}/matches`)
          .auth(token, { type: 'bearer' })
          .send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should create match for league admin', async () => {
    const dto = MockCreateMatchDto(teamA, teamB, refereeA, observerA);

    const response = await request(app.getHttpServer())
      .post(`/leagues/${league.id}/matches`)
      .auth(adminAJWT, { type: 'bearer' })
      .send(dto);

    match = {
      ...dto,
      id: expect.any(String),
      userReadableKey: expect.any(String),
      leagueId: league.id,
      observerSmsId: expect.any(String),
      mentorReportKey: null,
      observerReportKey: null,
      tvReportKey: null,
    };
    response.body.matchDate = new Date(response.body.matchDate);

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(match);

    match.id = response.body.id;
    match.userReadableKey = response.body.userReadableKey;
    match.observerSmsId = response.body.observerSmsId;

    matchInfo = {
      id: match.id,
      userReadableKey: match.userReadableKey,
      matchDate: expect.any(Date),
      stadium: match.stadium,
      homeTeam: teamA.name,
      awayTeam: teamB.name,
      referee: refereeA.firstName + ' ' + refereeA.lastName,
      observer: observerA.firstName + ' ' + observerA.lastName,
      leagueId: league.id,
    };

    const dbMatch = await getRepository(Match).findOne({ where: { id: match.id } });
    expect(match).toMatchObject(dbMatch);
  });

  it('should not update match for not league admin', async () => {
    const dto = MockCreateMatchDto(teamB, teamA, refereeA, observerA);

    await Promise.all(
      [adminBJWT, observerAJWT, refereeAJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .put(`/leagues/${league.id}/matches/${match.id}`)
          .auth(token, { type: 'bearer' })
          .send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should not update match with invalid referee/observer assignment', async () => {
    match.refereeId = refereeB.id;
    const dto = MockCreateMatchDto(teamB, teamA, refereeB, observerA);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${league.id}/matches/${match.id}`)
      .auth(adminAJWT, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should update match for league admin', async () => {
    const dto = MockCreateMatchDto(teamB, teamA, refereeB, observerA);

    const mockLeague = await getRepository(League).findOne({
      where: { id: league.id },
      relations: ['admins', 'referees', 'observers'],
    });
    mockLeague.referees.push(refereeB);
    await getRepository(League).save(mockLeague);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${league.id}/matches/${match.id}`)
      .auth(adminAJWT, { type: 'bearer' })
      .send(dto);

    response.body.matchDate = new Date(response.body.matchDate);
    match = { ...match, homeTeamId: teamB.id, awayTeamId: teamA.id, matchDate: expect.any(Date) };
    match.userReadableKey = response.body.userReadableKey;
    match.observerSmsId = response.body.observerSmsId;

    matchInfo.homeTeam = teamB.name;
    matchInfo.awayTeam = teamA.name;
    matchInfo.referee = refereeB.firstName + ' ' + refereeB.lastName;
    matchInfo.observer = observerA.firstName + ' ' + observerA.lastName;
    matchInfo.userReadableKey = match.userReadableKey;

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(match);

    const dbMatch = await getRepository(Match).findOne({ where: { id: match.id } });
    expect(match).toMatchObject(dbMatch);
  });

  it('should not get all matches in a league for not league admin', async () => {
    await Promise.all(
      [adminBJWT, observerAJWT, refereeAJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .get(`/leagues/${league.id}/matches`)
          .auth(token, { type: 'bearer' });

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should get all matches in a league for league admin', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${league.id}/matches`)
      .auth(adminAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    response.body[0].matchDate = new Date(response.body[0].matchDate);
    expect(response.body).toMatchObject([match]);

    const matches = await getRepository(Match).find({ where: { leagueId: league.id } });
    expect(response.body).toMatchObject(matches);
  });

  it.each([[Role.Admin], [Role.Referee], [Role.Observer]])('should get league match for match %s', async (role) => {
    const tokens = {
      [Role.Admin]: adminAJWT,
      [Role.Referee]: refereeBJWT,
      [Role.Observer]: observerAJWT,
    };

    const response = await request(app.getHttpServer())
      .get(`/leagues/${league.id}/matches/${match.id}`)
      .auth(tokens[role], { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    response.body.matchDate = new Date(response.body.matchDate);
    expect(response.body).toMatchObject(matchInfo);
  });

  it.each([[Role.Admin], [Role.Referee], [Role.Observer]])(
    'should not get league match for other match $role',
    async (role) => {
      const tokens = {
        [Role.Admin]: adminBJWT,
        [Role.Referee]: refereeAJWT,
        [Role.Observer]: observerBJWT,
      };
      const response = await request(app.getHttpServer())
        .get(`/leagues/${league.id}/matches/${match.id}`)
        .auth(tokens[role], { type: 'bearer' });

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    },
  );

  it('should update referee match grade', async () => {
    const dto = { refereeGrade: 5.5 } as UpdateMatchDto;

    const response = await request(app.getHttpServer())
      .put(`/leagues/${league.id}/matches/${match.id}/grade`)
      .auth(observerAJWT, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.OK);
    response.body.matchDate = new Date(response.body.matchDate);
    response.body.refereeGradeDate = new Date(response.body.refereeGradeDate);
    match = { ...match, refereeGrade: 5.5, refereeGradeDate: expect.any(Date) };
    matchInfo = { ...matchInfo, refereeGrade: 5.5, refereeGradeDate: expect.any(Date) };
    expect(response.body).toMatchObject(matchInfo);
  });

  it('should not update referee match grade if not match observer or league admin', async () => {
    await Promise.all(
      [refereeAJWT, observerBJWT].map(async (token) => {
        const dto = { refereeGrade: 5.5 } as UpdateMatchDto;

        const response = await request(app.getHttpServer())
          .put(`/leagues/${league.id}/matches/${match.id}/grade`)
          .auth(token, { type: 'bearer' })
          .send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should not update referee match grade if late', async () => {
    await setMockMatchDatetime(match.id, dayjs().subtract(4, 'day'));
    const dto = { refereeGrade: 5.5 } as UpdateMatchDto;

    const response = await request(app.getHttpServer())
      .put(`/leagues/${league.id}/matches/${match.id}/grade`)
      .auth(observerAJWT, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe(
      `Time window of ${GRADE_ENTRY_TIME_WINDOW - MATCH_DURATION} hours for this entry has passed.`,
    );
    await setMockMatchDatetime(match.id, dayjs().add(2, 'day'));
  });

  it('should not update referee overall grade if not match observer or league admin', async () => {
    await Promise.all(
      [adminBJWT, refereeAJWT, observerBJWT].map(async (token) => {
        const dto = { overallGrade: 'Mock overall grade.' } as UpdateMatchDto;

        const response = await request(app.getHttpServer())
          .put(`/leagues/${league.id}/matches/${match.id}/overallGrade`)
          .auth(token, { type: 'bearer' })
          .send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should update referee overall grade', async () => {
    const dto = { overallGrade: 'Mock overall grade.' } as UpdateMatchDto;

    const response = await request(app.getHttpServer())
      .put(`/leagues/${league.id}/matches/${match.id}/overallGrade`)
      .auth(observerAJWT, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.OK);
    response.body.matchDate = new Date(response.body.matchDate);
    response.body.refereeGradeDate = new Date(response.body.refereeGradeDate);
    response.body.overallGradeDate = new Date(response.body.overallGradeDate);
    match = { ...match, overallGrade: dto.overallGrade, overallGradeDate: expect.any(Date) };
    matchInfo = { ...matchInfo, overallGrade: dto.overallGrade, overallGradeDate: expect.any(Date) };
    expect(response.body).toMatchObject(matchInfo);
  });

  it('should not update referee overall grade if late', async () => {
    await setMockMatchDatetime(match.id, dayjs().subtract(8, 'day'));
    const dto = { overallGrade: 'Mock overall grade.' } as UpdateMatchDto;

    const response = await request(app.getHttpServer())
      .put(`/leagues/${league.id}/matches/${match.id}/overallGrade`)
      .auth(observerAJWT, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe(
      `Time window of ${OVERALL_GRADE_ENTRY_TIME_WINDOW - MATCH_DURATION} hours for this entry has passed.`,
    );

    await setMockMatchDatetime(match.id, dayjs().add(2, 'day'));
  });

  it('should not delete match for not league admin', async () => {
    await Promise.all(
      [adminBJWT, refereeAJWT, observerBJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .delete(`/leagues/${league.id}/matches/${match.id}`)
          .auth(token, { type: 'bearer' });

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
  `(
    'should not let $role upload $forbiddenResourceTypes reports for upcoming match',
    async ({ role, forbiddenResourceTypes }) => {
      const tokens = {
        [Role.Admin]: adminAJWT,
        [Role.Owner]: ownerJWT,
        [Role.Referee]: refereeBJWT,
        [Role.Observer]: observerAJWT,
      };

      await Promise.all(
        forbiddenResourceTypes.map(async (reportType) => {
          const response = await request(app.getHttpServer())
            .post(`/leagues/${league.id}/matches/${match.id}/reports/${reportType}`)
            .auth(tokens[role], { type: 'bearer' })
            .send();

          expect(response.status).toBe(HttpStatus.BAD_REQUEST);
          expect(response.body.message).toBe(`Match is upcoming.`);
        }),
      );
    },
  );

  it.each`
    role             | forbiddenResourceTypes
    ${Role.Observer} | ${[ReportType.Tv, ReportType.Mentor]}
  `(
    'should not let $role download $forbiddenResourceTypes reports for upcoming match',
    async ({ role, forbiddenResourceTypes }) => {
      const tokens = {
        [Role.Admin]: adminAJWT,
        [Role.Owner]: ownerJWT,
        [Role.Referee]: refereeBJWT,
        [Role.Observer]: observerAJWT,
      };

      await Promise.all(
        forbiddenResourceTypes.map(async (reportType) => {
          const response = await request(app.getHttpServer())
            .post(`/leagues/${league.id}/matches/${match.id}/reports/${reportType}`)
            .auth(tokens[role], { type: 'bearer' })
            .send();

          expect(response.status).toBe(HttpStatus.BAD_REQUEST);
          expect(response.body.message).toBe(`Match is upcoming.`);
        }),
      );
    },
  );

  it.each`
    role             | forbiddenResourceTypes
    ${Role.Owner}    | ${[ReportType.Mentor, ReportType.Tv, ReportType.Observer]}
    ${Role.Admin}    | ${[ReportType.Mentor, ReportType.Tv, ReportType.Observer]}
    ${Role.Referee}  | ${[ReportType.Observer]}
    ${Role.Observer} | ${[ReportType.Tv, ReportType.Mentor]}
  `(
    'should not let $role remove $forbiddenResourceTypes reports for upcoming match',
    async ({ role, forbiddenResourceTypes }) => {
      const tokens = {
        [Role.Admin]: adminAJWT,
        [Role.Owner]: ownerJWT,
        [Role.Referee]: refereeBJWT,
        [Role.Observer]: observerAJWT,
      };

      await Promise.all(
        forbiddenResourceTypes.map(async (reportType) => {
          const response = await request(app.getHttpServer())
            .delete(`/leagues/${league.id}/matches/${match.id}/reports/${reportType}`)
            .auth(tokens[role], { type: 'bearer' })
            .send();

          expect(response.status).toBe(HttpStatus.BAD_REQUEST);
          expect(response.body.message).toBe(`Match is upcoming.`);
        }),
      );
    },
  );

  describe('match reports', () => {
    beforeAll(async () => {
      const matchRepository = getRepository(Match);
      const mockMatch = await matchRepository.findOne({ where: { id: match.id } });
      mockMatch.matchDate = dayjs().subtract(1, 'day').toDate();
      await matchRepository.save(mockMatch);
    });

    it.each`
      role             | forbiddenResourceTypes
      ${Role.Owner}    | ${[ReportType.Mentor, ReportType.Tv, ReportType.Observer]}
      ${Role.Admin}    | ${[ReportType.Mentor, ReportType.Tv, ReportType.Observer]}
      ${Role.Referee}  | ${[ReportType.Observer]}
      ${Role.Observer} | ${[ReportType.Tv, ReportType.Mentor]}
    `('should not let $role upload $forbiddenResourceTypes reports', async ({ role, forbiddenResourceTypes }) => {
      const tokens = {
        [Role.Admin]: adminAJWT,
        [Role.Owner]: ownerJWT,
        [Role.Referee]: refereeBJWT,
        [Role.Observer]: observerAJWT,
      };

      await Promise.all(
        forbiddenResourceTypes.map(async (reportType) => {
          const response = await request(app.getHttpServer())
            .post(`/leagues/${league.id}/matches/${match.id}/reports/${reportType}`)
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
        [Role.Admin]: adminAJWT,
        [Role.Owner]: ownerJWT,
        [Role.Referee]: refereeBJWT,
        [Role.Observer]: observerAJWT,
      };

      await Promise.all(
        forbiddenResourceTypes.map(async (reportType) => {
          const response = await request(app.getHttpServer())
            .post(`/leagues/${league.id}/matches/${match.id}/reports/${reportType}`)
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
    `('should not let $role remove $forbiddenResourceTypes reports ', async ({ role, forbiddenResourceTypes }) => {
      const tokens = {
        [Role.Admin]: adminAJWT,
        [Role.Owner]: ownerJWT,
        [Role.Referee]: refereeBJWT,
        [Role.Observer]: observerAJWT,
      };

      await Promise.all(
        forbiddenResourceTypes.map(async (reportType) => {
          const response = await request(app.getHttpServer())
            .delete(`/leagues/${league.id}/matches/${match.id}/reports/${reportType}`)
            .auth(tokens[role], { type: 'bearer' })
            .send();

          expect(response.status).toBe(HttpStatus.FORBIDDEN);
        }),
      );
    });
  });

  it('should delete match', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${league.id}/matches/${match.id}`)
      .auth(adminAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    response.body.matchDate = new Date(response.body.matchDate);
    response.body.refereeGradeDate = new Date(response.body.refereeGradeDate);
    response.body.overallGradeDate = new Date(response.body.overallGradeDate);
    expect(response.body).toMatchObject(match);

    const dbMatch = await getRepository(Match).findOne({ where: { id: match.id } });
    expect(dbMatch).toBeUndefined();
  });
});
