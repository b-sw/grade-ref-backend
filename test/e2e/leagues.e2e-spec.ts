import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { getRepository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { MockUser } from '../shared/mockUser';
import request from 'supertest';
import { MockCreateLeagueDto } from '../shared/mockLeague';
import { League } from 'src/entities/league.entity';
import { Role } from 'src/modules/users/constants/users.constants';
import { getSignedJwt } from '../shared/jwt';
import { uuid } from 'src/shared/types/uuid.type';

describe('e2e leagues', () => {
    const adminA = MockUser({ role: Role.Admin, email: 'admin@mail.com', lastName: 'Doe1' });
    const adminB = MockUser({ role: Role.Admin, email: 'admin2@mail.com', lastName: 'Doe2' });
    const referee = MockUser({ role: Role.Referee, email: 'ref@mail.com', lastName: 'Doe3' });
    const observer = MockUser({
        role: Role.Observer,
        email: 'obs@mail.com',
        lastName: 'Doe4',
    });
    const users = [adminA, adminB, referee, observer];

    let app: INestApplication;
    let adminAJWT: string;
    let adminBJWT: string;
    let observerJWT: string;
    let refereeJWT: string;
    let league: League;
    let tokens: { [key: uuid]: string };

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const usersRepository = await getRepository(User);
        await Promise.all(users.map(async (user) => await usersRepository.save(user)));

        adminAJWT = getSignedJwt(adminA);
        adminBJWT = getSignedJwt(adminB);
        observerJWT = getSignedJwt(observer);
        refereeJWT = getSignedJwt(referee);

        tokens = {
            [adminA.id]: adminAJWT,
            [adminB.id]: adminBJWT,
            [observer.id]: observerJWT,
            [referee.id]: refereeJWT,
        };
    });

    afterAll(async () => {
        await getRepository(User).clear();
        await getRepository(League).clear();
    });

    it('should create league for admin', async () => {
        const dto = MockCreateLeagueDto({});
        league = { ...dto, id: expect.any(String), admins: [adminA], referees: [], observers: [] };

        const response = await request(app.getHttpServer())
            .post('/leagues')
            .auth(adminAJWT, { type: 'bearer' })
            .send(dto);

        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toMatchObject(league);

        league.id = response.body.id;

        const leagues = await getRepository(League).find({ relations: ['admins', 'referees', 'observers'] });
        expect(leagues).toHaveLength(1);
        expect(leagues[0]).toMatchObject(league);
    });

    it('should not create league for not admin', async () => {
        const dto = MockCreateLeagueDto({});

        await Promise.all(
            [refereeJWT, observerJWT].map(async (token) => {
                const response = await request(app.getHttpServer())
                    .post('/leagues')
                    .auth(token, { type: 'bearer' })
                    .send(dto);

                expect(response.status).toBe(HttpStatus.FORBIDDEN);
            }),
        );
    });

    it('should get leagues for self', async () => {
        const leagueRepository = await getRepository(League);
        const mockLeague = await leagueRepository.findOne({
            where: { id: league.id },
            relations: ['admins', 'referees', 'observers'],
        });
        mockLeague.referees = [referee];
        mockLeague.observers = [observer];
        await leagueRepository.save(mockLeague);
        league = mockLeague;

        await Promise.all(
            [adminA, observer, referee].map(async (user) => {
                const response = await request(app.getHttpServer())
                    .get(`/users/${user.id}/leagues`)
                    .auth(tokens[user.id], { type: 'bearer' });

                expect(response.status).toBe(HttpStatus.OK);
                expect(response.body).toHaveLength(1);
            }),
        );
    });

    it('should not get leagues for not app user', async () => {
        const response = await request(app.getHttpServer()).get(`/users/${adminA.id}/leagues`);

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should get league for league admin', async () => {
        const response = await request(app.getHttpServer())
            .get(`/leagues/${league.id}`)
            .auth(adminAJWT, { type: 'bearer' });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toMatchObject(league);
    });

    it('should not get league for not league admin', async () => {
        await Promise.all(
            [adminBJWT, refereeJWT, observerJWT].map(async (token) => {
                const response = await request(app.getHttpServer())
                    .get(`/leagues/${league.id}`)
                    .auth(token, { type: 'bearer' });

                expect(response.status).toBe(HttpStatus.FORBIDDEN);
            }),
        );
    });

    it('should update league', async () => {
        const dto = MockCreateLeagueDto({ name: 'Mock League Updated' });

        const response = await request(app.getHttpServer())
            .put(`/leagues/${league.id}`)
            .auth(adminAJWT, { type: 'bearer' })
            .send(dto);

        league.name = dto.name;

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toMatchObject(league);

        const updatedLeague = await getRepository(League).findOne({
            where: { id: league.id },
            relations: ['admins', 'referees', 'observers'],
        });
        expect(updatedLeague).toMatchObject(league);
    });

    it('should not update league', async () => {
        const dto = MockCreateLeagueDto({ name: 'Mock League Updated' });

        await Promise.all(
            [adminBJWT, refereeJWT, observerJWT].map(async (token) => {
                const response = await request(app.getHttpServer())
                    .put(`/leagues/${league.id}`)
                    .auth(token, { type: 'bearer' })
                    .send(dto);

                expect(response.status).toBe(HttpStatus.FORBIDDEN);
            }),
        );
    });

    it('should not delete league', async () => {
        await Promise.all(
            [adminBJWT, refereeJWT, observerJWT].map(async (token) => {
                const response = await request(app.getHttpServer())
                    .delete(`/leagues/${league.id}`)
                    .auth(token, { type: 'bearer' });

                expect(response.status).toBe(HttpStatus.FORBIDDEN);
            }),
        );
    });

    it('should delete league', async () => {
        const response = await request(app.getHttpServer())
            .delete(`/leagues/${league.id}`)
            .auth(adminAJWT, { type: 'bearer' });

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body).toMatchObject(league);

        const leagues = await getRepository(League).find();
        expect(leagues).toHaveLength(0);
    });
});
