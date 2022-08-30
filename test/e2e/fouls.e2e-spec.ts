import { getRepository } from 'typeorm';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { MockUser } from '../shared/mockUser';
import { MockLeague } from '../shared/mockLeague';
import { MockTeam } from '../shared/mockTeam';
import { MockMatch, setMockMatchDatetime } from '../shared/mockMatch';
import request from 'supertest';
import { MockCreateFoulDto } from '../shared/mockFoul';
import dayjs from 'dayjs';
import { getSignedJwt } from '../shared/jwt';
import { Role } from 'src/modules/users/constants/users.constants';
import { Foul } from 'src/entities/foul.entity';
import { League } from 'src/entities/league.entity';
import { User } from 'src/entities/user.entity';
import { UpdateMatchDto } from 'src/modules/matches/dto/update-match.dto';
import { MATCH_DURATION, OVERALL_GRADE_ENTRY_TIME_WINDOW } from 'src/modules/matches/matches.service';
import { Team } from 'src/entities/team.entity';
import { Match } from 'src/entities/match.entity';

describe('e2e fouls', () => {
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
    const users = [admin, refereeA, refereeB, observerA];

    const teamA: Team = MockTeam(league.id, league, 'FC Team A');
    const teamB: Team = MockTeam(league.id, league, 'FC Team B');
    const match: Match = MockMatch(teamA, teamB, refereeA, observerA, league);

    let foul: Partial<Foul>;
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
        await matchRepository.save(match);

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
        await getRepository(Foul).clear();
    });

    it('should not create foul for not match observer', async () => {
        const dto = MockCreateFoulDto(teamA.id);

        await Promise.all(
            [adminJWT, refereeAJWT].map(async (token) => {
                const response = await request(app.getHttpServer())
                    .post(`/leagues/${league.id}/matches/${match.id}/fouls`)
                    .auth(token, { type: 'bearer' })
                    .send(dto);

                expect(response.status).toBe(HttpStatus.FORBIDDEN);
            }),
        );
    });

    it('should create foul for match observer', async () => {
        const dto = MockCreateFoulDto(teamA.id);

        const response = await request(app.getHttpServer())
            .post(`/leagues/${league.id}/matches/${match.id}/fouls`)
            .auth(observerAJWT, { type: 'bearer' })
            .send(dto);

        foul = {
            ...dto,
            id: response.body.id,
            matchId: response.body.matchId,
        };

        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toMatchObject(foul);

        const retrievedFoul = await getRepository(Foul).findOne({ where: { id: foul.id } });
        expect(retrievedFoul).toMatchObject(foul);
    });

    it('should not get foul for not match user', async () => {
        const response = await request(app.getHttpServer())
            .get(`/leagues/${league.id}/matches/${match.id}/fouls/${foul.id}`)
            .auth(refereeBJWT, { type: 'bearer' });

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('should get foul for match user', async () => {
        await Promise.all(
            [adminJWT, refereeAJWT, observerAJWT].map(async (token) => {
                const response = await request(app.getHttpServer())
                    .get(`/leagues/${league.id}/matches/${match.id}/fouls/${foul.id}`)
                    .auth(token, { type: 'bearer' });

                expect(response.status).toBe(HttpStatus.OK);
                expect(response.body).toMatchObject(foul);

                const retrievedFoul = await getRepository(Foul).findOne({ where: { id: foul.id } });
                expect(retrievedFoul).toMatchObject(foul);
            }),
        );
    });

    it('should not get match fouls for not match user', async () => {
        const response = await request(app.getHttpServer())
            .get(`/leagues/${league.id}/matches/${match.id}/fouls`)
            .auth(refereeBJWT, { type: 'bearer' });

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('should get match fouls for match users', async () => {
        await Promise.all(
            [adminJWT, refereeAJWT, observerAJWT].map(async (token) => {
                const response = await request(app.getHttpServer())
                    .get(`/leagues/${league.id}/matches/${match.id}/fouls`)
                    .auth(token, { type: 'bearer' });

                expect(response.status).toBe(HttpStatus.OK);
                expect(response.body).toMatchObject([foul]);

                const retrievedFouls = await getRepository(Foul).find({ where: { matchId: match.id } });
                expect(retrievedFouls.length).toBe(1);
                expect(retrievedFouls[0]).toMatchObject(foul);
            }),
        );
    });

    it('should not update foul for not match observer', async () => {
        const dto = MockCreateFoulDto(teamB.id);

        await Promise.all(
            [adminJWT, refereeAJWT, observerBJWT].map(async (token) => {
                const response = await request(app.getHttpServer())
                    .put(`/leagues/${league.id}/matches/${match.id}/fouls/${foul.id}`)
                    .auth(token, { type: 'bearer' })
                    .send(dto);

                expect(response.status).toBe(HttpStatus.FORBIDDEN);
            }),
        );
    });

    it('should update foul for match observer', async () => {
        const dto = MockCreateFoulDto(teamB.id);

        const response = await request(app.getHttpServer())
            .put(`/leagues/${league.id}/matches/${match.id}/fouls/${foul.id}`)
            .auth(observerAJWT, { type: 'bearer' })
            .send(dto);

        foul.teamId = teamB.id;

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toMatchObject(foul);

        const retrievedFoul = await getRepository(Foul).findOne({ where: { id: foul.id } });
        expect(retrievedFoul).toMatchObject(foul);
    });

    it('should not update foul if late', async () => {
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

    it('should not remove foul for not match observer', async () => {
        await Promise.all(
            [adminJWT, refereeAJWT, observerBJWT].map(async (token) => {
                const response = await request(app.getHttpServer())
                    .delete(`/leagues/${league.id}/matches/${match.id}/fouls/${foul.id}`)
                    .auth(token, { type: 'bearer' });

                expect(response.status).toBe(HttpStatus.FORBIDDEN);
            }),
        );
    });

    it('should remove foul', async () => {
        const response = await request(app.getHttpServer())
            .delete(`/leagues/${league.id}/matches/${match.id}/fouls/${foul.id}`)
            .auth(observerAJWT, { type: 'bearer' });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toMatchObject(foul);

        const retrievedFoul = await getRepository(Foul).findOne({ where: { id: foul.id } });
        expect(retrievedFoul).toBeUndefined();
    });
});
