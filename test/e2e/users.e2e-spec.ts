import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { getRepository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { MockCreateUserDto, MockUser } from '../shared/mockUser';
import { CreateUserDto } from '../../src/domains/users/dto/create-user.dto';
import request from 'supertest';
import { League } from '../../src/entities/league.entity';
import { MockLeague } from '../shared/mockLeague';
import { Role } from '../../src/domains/users/constants/users.constants';

describe('e2e users', () => {
  const owner = MockUser({ role: Role.Owner, email: 'mock@mail.com' });
  const adminB = MockUser({ role: Role.Admin, email: 'adminB@mail.com', lastName: 'Doe1' });
  const league = MockLeague({});

  let app: INestApplication;
  let adminA: User;
  let referee: User;
  let observer: User;
  let ownerJWT: string;
  let adminAJWT: string;
  let adminBJWT: string;
  let refereeJWT: string;
  let observerJWT: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await getRepository(User).save(owner);
    await getRepository(League).save(league);

    ownerJWT = jwt.sign({ email: owner.email, sub: owner.id }, process.env.JWT_SECRET);
    adminBJWT = jwt.sign({ email: adminB.email, sub: adminB.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await getRepository(User).clear();
    await getRepository(League).clear();
  });

  it('should create admin for owner', async () => {
    const dto = MockCreateUserDto({
      role: Role.Admin,
      firstName: 'Jane',
      lastName: 'Doe2',
      email: 'jane@mail.com',
    });

    const response = await createUser(dto, ownerJWT);
    adminA = response.body;
    const payload = { email: response.body.email, sub: response.body.id };
    adminAJWT = jwt.sign(payload, process.env.JWT_SECRET);

    const admins: User[] = await getRepository(User).find({ where: { role: Role.Admin } });
    expect(admins).toHaveLength(1);
  });

  it('should not create admin for not owner', async () => {
    const dto = MockCreateUserDto({
      role: Role.Admin,
      firstName: 'Jackson',
      lastName: 'Doe3',
      email: 'jackson@mail.com',
    });

    const response = await request(app.getHttpServer()).post('/users').auth(adminAJWT, { type: 'bearer' }).send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should create referee for owner', async () => {
    const dto = MockCreateUserDto({
      role: Role.Referee,
      firstName: 'Jackson',
      lastName: 'Doe4',
      email: 'jackson@mail.com',
    });

    const response = await createUser(dto, ownerJWT);
    referee = response.body;
    const payload = { email: referee.email, sub: referee.id };
    refereeJWT = jwt.sign(payload, process.env.JWT_SECRET);

    const referees: User[] = await getRepository(User).find({ where: { role: Role.Referee } });
    expect(referees).toHaveLength(1);
  });

  it('should not create referee for not owner', async () => {
    const dto = MockCreateUserDto({
      role: Role.Referee,
      firstName: 'James',
      lastName: 'Doe4',
      email: 'james@mail.com',
    });

    await Promise.all(
      [refereeJWT, adminAJWT].map(async (token) => {
        const response = await request(app.getHttpServer()).post('/users').auth(token, { type: 'bearer' }).send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should create observer for owner', async () => {
    const dto = MockCreateUserDto({
      role: Role.Observer,
      firstName: 'Jake',
      lastName: 'Doe5',
      email: 'jake@mail.com',
    });
    const response = await createUser(dto, ownerJWT);

    observer = response.body;
    const payload = { email: observer.email, sub: observer.id };
    observerJWT = jwt.sign(payload, process.env.JWT_SECRET);

    const observers = await getRepository(User).find({ where: { role: Role.Observer } });
    expect(observers).toHaveLength(1);
  });

  it('should not create observer for not owner', async () => {
    const dto = MockCreateUserDto({
      role: Role.Observer,
      firstName: 'Jake',
      lastName: 'Doe5',
      email: 'jake@mail.com',
    });

    await Promise.all(
      [adminAJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer()).post('/users').auth(token, { type: 'bearer' }).send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  const createUser = async (dto: CreateUserDto, token: string) => {
    const expectedUser = { ...dto, id: expect.any(String) };

    const response = await request(app.getHttpServer()).post('/users').auth(token, { type: 'bearer' }).send(dto);

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(expectedUser);
    return response;
  };

  it('should update user for owner', async () => {
    const dto = MockCreateUserDto({
      firstName: 'Jaime',
      lastName: 'Doe6',
      email: 'jaime@mail.com',
    });

    const expectedUser = { ...dto, id: referee.id };

    const response = await request(app.getHttpServer())
      .put(`/users/${referee.id}`)
      .auth(ownerJWT, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(expectedUser);
    referee = response.body;

    const user: User = await getRepository(User).findOne({ where: { id: referee.id } });
    expect(referee).toMatchObject(user);
  });

  it('should not update user for not owner', async () => {
    const dto = MockCreateUserDto({
      firstName: 'Jaime',
      lastName: 'Doe6',
      email: 'jaime@mail.com',
    });

    await Promise.all(
      [adminAJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .put(`/users/${referee.id}`)
          .auth(token, { type: 'bearer' })
          .send(dto);

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should get all referees for league admin', async () => {
    const response = await request(app.getHttpServer()).get('/users/referees').auth(adminAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);

    const responseReferees = response.body;
    expect(responseReferees[0]).toMatchObject(referee);

    const dbReferees = await getRepository(User).find({ where: { role: Role.Referee } });
    expect(dbReferees).toHaveLength(1);
    expect(dbReferees[0]).toMatchObject(referee);
  });

  it('should not get all referees for not league admin', async () => {
    await Promise.all(
      [adminBJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer()).get('/users/referees').auth(token, { type: 'bearer' });
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should get all observers for league admin', async () => {
    const response = await request(app.getHttpServer()).get('/users/observers').auth(adminAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);

    const observers = response.body;
    expect(observers[0]).toMatchObject(observer);

    const dbObservers = await getRepository(User).find({ where: { role: Role.Observer } });
    expect(dbObservers).toHaveLength(1);
    expect(dbObservers[0]).toMatchObject(observer);
  });

  it('should not get all observers for not league admin', async () => {
    await Promise.all(
      [adminBJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer()).get('/users/observers').auth(token, { type: 'bearer' });
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should add league admin for owner', async () => {
    const response = await request(app.getHttpServer())
      .post(`/leagues/${league.id}/admins/${adminA.id}`)
      .auth(ownerJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(adminA);

    const dbLeagueAdmins = (
      await getRepository(League).findOne({
        where: { id: league.id },
        relations: ['admins'],
      })
    ).admins;
    expect(dbLeagueAdmins).toHaveLength(1);
    expect(dbLeagueAdmins[0]).toMatchObject(adminA);
  });

  it('should not add league admin for not owner', async () => {
    await Promise.all(
      [adminAJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .post(`/leagues/${league.id}/admins/${adminA.id}`)
          .auth(token, { type: 'bearer' });
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should add league observer for league admin', async () => {
    const response = await request(app.getHttpServer())
      .post(`/leagues/${league.id}/observers/${observer.id}`)
      .auth(adminAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(observer);

    const dbLeagueObservers = (
      await getRepository(League).findOne({
        where: { id: league.id },
        relations: ['observers'],
      })
    ).observers;
    expect(dbLeagueObservers).toHaveLength(1);
    expect(dbLeagueObservers[0]).toMatchObject(observer);
  });

  it('should not add league observer for not league admin', async () => {
    await Promise.all(
      [adminBJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .post(`/leagues/${league.id}/observers/${observer.id}`)
          .auth(token, { type: 'bearer' });
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should add league referee for league admin', async () => {
    const response = await request(app.getHttpServer())
      .post(`/leagues/${league.id}/referees/${referee.id}`)
      .auth(adminAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(referee);

    const dbLeagueReferees = (
      await getRepository(League).findOne({
        where: { id: league.id },
        relations: ['referees'],
      })
    ).referees;
    expect(dbLeagueReferees).toHaveLength(1);
    expect(dbLeagueReferees[0]).toMatchObject(referee);
  });

  it('should not add league referee for not league admin', async () => {
    await Promise.all(
      [adminBJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .post(`/leagues/${league.id}/referees/${referee.id}`)
          .auth(token, { type: 'bearer' });
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should remove league observer for league admin', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${league.id}/observers/${observer.id}`)
      .auth(adminAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(observer);

    const dbLeagueObservers = (
      await getRepository(League).findOne({
        where: { id: league.id },
        relations: ['observers'],
      })
    ).observers;
    expect(dbLeagueObservers).toHaveLength(0);
  });

  it('should not remove league observer for not league admin', async () => {
    await Promise.all(
      [adminBJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .delete(`/leagues/${league.id}/observers/${observer.id}`)
          .auth(token, { type: 'bearer' });
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should remove league referee for league admin', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${league.id}/referees/${referee.id}`)
      .auth(adminAJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(referee);

    const dbLeagueReferees = (
      await getRepository(League).findOne({
        where: { id: league.id },
        relations: ['referees'],
      })
    ).referees;
    expect(dbLeagueReferees).toHaveLength(0);
  });

  it('should not remove league referee for not league admin', async () => {
    await Promise.all(
      [adminBJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .delete(`/leagues/${league.id}/referees/${referee.id}`)
          .auth(token, { type: 'bearer' });
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should remove league admin for owner', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${league.id}/admins/${adminA.id}`)
      .auth(ownerJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(adminA);

    const dbLeagueAdmins = (
      await getRepository(League).findOne({
        where: { id: league.id },
        relations: ['admins'],
      })
    ).admins;
    expect(dbLeagueAdmins).toHaveLength(0);
  });

  it('should not remove league admin for not owner', async () => {
    await Promise.all(
      [adminAJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .delete(`/leagues/${league.id}/admins/${adminA.id}`)
          .auth(token, { type: 'bearer' });
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });

  it('should delete user for owner', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/users/${adminA.id}`)
      .auth(ownerJWT, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);

    const users = await getRepository(User).find();
    expect(users).toHaveLength(3);
  });

  it('should not delete user for not owner', async () => {
    await Promise.all(
      [adminAJWT, refereeJWT, observerJWT].map(async (token) => {
        const response = await request(app.getHttpServer())
          .delete(`/users/${adminA.id}`)
          .auth(token, { type: 'bearer' });
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
      }),
    );
  });
});
