import { getRepository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { League } from '../../src/entities/league.entity';
import { Team } from '../../src/entities/team.entity';
import { Match } from '../../src/entities/match.entity';
import { MockUser } from '../shared/mockUser';
import { v4 as randomUuid } from 'uuid';
import { Role } from '../../src/shared/types/role';
import { MockLeague } from '../shared/mockLeague';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import * as jwt from 'jsonwebtoken';
import { CreateMatchDto } from '../../src/matches/dto/create-match.dto';
import * as request from 'supertest';
import { MockCreateMatchDto } from '../shared/mockMatch';
import { MockTeam } from '../shared/mockTeam';
import { UpdateMatchDto } from 'src/matches/dto/update-match.dto';

describe('e2e matches', () => {
  const mockOwner: User = MockUser({ id: randomUuid(), role: Role.Owner, email: 'mock@mail.com' });
  const mockAdmin: User = MockUser( { id: randomUuid(), role: Role.Admin, email: 'admin@mail.com' });
  const mockReferee: User = MockUser( { id: randomUuid(), role: Role.Referee, email: 'ref@mail.com' });
  const mockRefereeB: User = MockUser( { id: randomUuid(), role: Role.Referee, email: 'ref2@mail.com' });
  const mockObserver: User = MockUser( { id: randomUuid(), role: Role.Observer, email: 'obs@mail.com' });
  const mockLeague: League = MockLeague({ admins: [mockAdmin], referees: [mockReferee], observers: [mockObserver] });
  const users: User[] = [mockOwner, mockAdmin, mockReferee, mockRefereeB, mockObserver];

  const teamA: Team = MockTeam(mockLeague.id, mockLeague, 'FC Team A');
  const teamB: Team = MockTeam(mockLeague.id, mockLeague, 'FC Team B');

  let mockMatch: Partial<Match>;
  let ownerAccessToken: string;
  let adminAccessToken: string;
  let refereeAccessToken: string;
  let observerAccessToken: string;
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
    await leagueRepository.save(mockLeague);

    const teamRepository = await getRepository(Team);
    await teamRepository.save(teamA);
    await teamRepository.save(teamB);

    ownerAccessToken = jwt.sign({ email: mockOwner.email, sub: mockOwner.id }, process.env.JWT_SECRET);
    adminAccessToken = jwt.sign({ email: mockAdmin.email, sub: mockAdmin.id }, process.env.JWT_SECRET);
    refereeAccessToken = jwt.sign({ email: mockReferee.email, sub: mockReferee.id }, process.env.JWT_SECRET);
    observerAccessToken = jwt.sign({ email: mockObserver.email, sub: mockObserver.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await getRepository(User).clear();
    await getRepository(League).clear();
    await getRepository(Team).clear();
    await getRepository(Match).clear();
  });

  it('should not create match', async () => {
    const dto: CreateMatchDto = MockCreateMatchDto(teamA, teamB, mockReferee, mockObserver);

    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/matches`)
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should create match', async () => {
    const dto: CreateMatchDto = MockCreateMatchDto(teamA, teamB, mockReferee, mockObserver);

    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/matches`)
      .auth(adminAccessToken, { type: 'bearer' })
      .send(dto);

    mockMatch = { ...dto,
      id: expect.any(String),
      userReadableKey: expect.any(String),
      leagueId: mockLeague.id,
      observerSmsId: expect.any(String)
    };
    response.body.matchDate = new Date(response.body.matchDate)

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(mockMatch);

    mockMatch.id = response.body.id;

    const match: Match = await getRepository(Match).findOne({ where: { id: mockMatch.id } });
    expect(match).toMatchObject(mockMatch);
  });

  it('should not update match for referee request', async () => {
    const dto: UpdateMatchDto = MockCreateMatchDto(teamB, teamA, mockReferee, mockObserver);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}`)
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not update match with invalid assignment', async () => {
    mockMatch.refereeId = mockRefereeB.id;
    const dto: UpdateMatchDto = MockCreateMatchDto(teamB, teamA, mockRefereeB, mockObserver);

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}`)
      .auth(adminAccessToken, { type: 'bearer' })
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
      .auth(adminAccessToken, { type: 'bearer' })
      .send(dto);

    response.body.matchDate = new Date(response.body.matchDate);
    mockMatch = { ...mockMatch, homeTeamId: teamB.id, awayTeamId: teamA.id, matchDate: expect.any(Date) }
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(mockMatch);

    const match: Match = await getRepository(Match).findOne({ where: { id: mockMatch.id } });
    expect(match).toMatchObject(mockMatch);
  });

  it('should not get all matches in a league', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should get all matches in a league', async () => {
    const response = await request(app.getHttpServer())
      .get(`/leagues/${mockLeague.id}/matches`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    response.body[0].matchDate = new Date(response.body[0].matchDate);
    expect(response.body).toMatchObject([mockMatch]);

    const matches: Match[] = await getRepository(Match).find({ where: { leagueId: mockLeague.id } });
    expect(response.body).toMatchObject(matches);
  });

  it('should not get observer matches for admin', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${mockObserver.id}/matches`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not get observer matches for referee', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${mockObserver.id}/matches`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should get observer matches for self', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${mockObserver.id}/matches`)
      .auth(observerAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    response.body[0].matchDate = new Date(response.body[0].matchDate);
    expect(response.body).toMatchObject([mockMatch]);

    const matches: Match[] = await getRepository(Match).find({ where: { observerId: mockObserver.id } });
    expect(response.body).toMatchObject(matches);
  });

  it('should get referee matches', async () => {
    refereeAccessToken = jwt.sign({ email: mockRefereeB.email, sub: mockRefereeB.id }, process.env.JWT_SECRET);

    const response = await request(app.getHttpServer())
      .get(`/users/${mockRefereeB.id}/matches`)
      .auth(refereeAccessToken, { type: 'bearer' });

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
      .auth(observerAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.OK);
    response.body.matchDate = new Date(response.body.matchDate);
    response.body.refereeGradeDate = new Date(response.body.refereeGradeDate);
    mockMatch = { ...mockMatch, refereeGrade: 5.5, refereeGradeDate: expect.any(Date) };
    expect(response.body).toMatchObject(mockMatch);

    const match: Match = await getRepository(Match).findOne({ where: { id: mockMatch.id } });
    expect(response.body).toMatchObject(match);
  });

  it('should not update referee match grade', async () => {
    const dto: UpdateMatchDto = { refereeGrade: 5.5 } as UpdateMatchDto;

    const response = await request(app.getHttpServer())
      .put(`/leagues/${mockLeague.id}/matches/${mockMatch.id}/grade`)
      .auth(adminAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should not delete match', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/matches/${mockMatch.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should delete match', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/matches/${mockMatch.id}`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    response.body.matchDate = new Date(response.body.matchDate);
    response.body.refereeGradeDate = new Date(response.body.refereeGradeDate);
    expect(response.body).toMatchObject(mockMatch);

    const match: Match = await getRepository(Match).findOne({ where: { id: mockMatch.id } });
    expect(match).toBeUndefined();
  });
});