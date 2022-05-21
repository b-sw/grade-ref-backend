import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/shared/types/role';
import { getRepository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { MockCreateUserDto, MockUser } from '../shared/mockUser';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import * as request from 'supertest';
import { UpdateUserDto } from '../../src/users/dto/update-user.dto';
import { League } from '../../src/entities/league.entity';
import { MockLeague } from '../shared/mockLeague';

describe('e2e users', () => {
  const mockUser: User = MockUser({ role: Role.Owner, email: 'mock@mail.com' });
  const mockLeague: League = MockLeague({});

  let app: INestApplication;
  let admin: User;
  let referee: User;
  let observer: User;
  let ownerAccessToken: string;
  let adminAccessToken: string;
  let refereeAccessToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await getRepository(User).save(mockUser);
    await getRepository(League).save(mockLeague);
    const payload = { email: mockUser.email, sub: mockUser.id };
    ownerAccessToken = jwt.sign(payload, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await getRepository(User).clear();
    await getRepository(League).clear();
  });

  it('should create admin', async () => {
    const dto: CreateUserDto = MockCreateUserDto({
      role: Role.Admin,
      firstName: 'Jane',
      email: 'jane@mail.com',
    });

    const response = await createUser(dto, ownerAccessToken);
    admin = response.body;
    const payload = { email: response.body.email, sub: response.body.id };
    adminAccessToken = jwt.sign(payload, process.env.JWT_SECRET);

    const admins: User[] = await getRepository(User).find({ where: { role: Role.Admin } });
    expect(admins).toHaveLength(1);
  });

  it('should not create admin', async () => {
    const dto: CreateUserDto = MockCreateUserDto({
      role: Role.Admin,
      firstName: 'Jackson',
      email: 'jackson@mail.com',
    });

    const response = await request(app.getHttpServer())
      .post('/users')
      .auth(adminAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should create referee', async () => {
    const dto: CreateUserDto = MockCreateUserDto({
      role: Role.Referee,
      firstName: 'Jackson',
      email: 'jackson@mail.com',
    });

    const response = await createUser(dto, ownerAccessToken);
    referee = response.body;
    const payload = { email: referee.email, sub: referee.id };
    refereeAccessToken = jwt.sign(payload, process.env.JWT_SECRET);

    const referees: User[] = await getRepository(User).find({ where: { role: Role.Referee } });
    expect(referees).toHaveLength(1);
  });

  it('should not create referee', async () => {
    const dto: CreateUserDto = MockCreateUserDto({
      role: Role.Referee,
      firstName: 'James',
      email: 'james@mail.com',
    });

    const response = await request(app.getHttpServer())
      .post('/users')
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should create observer', async () => {
    const dto: CreateUserDto = MockCreateUserDto({
      role: Role.Observer,
      firstName: 'Jake',
      email: 'jake@mail.com',
    });
    const response = await createUser(dto, ownerAccessToken);
    observer = response.body;

    const observers: User[] = await getRepository(User).find({ where: { role: Role.Observer } });
    expect(observers).toHaveLength(1);
  });

  it('should not create observer', async () => {
    const dto: CreateUserDto = MockCreateUserDto({
      role: Role.Observer,
      firstName: 'Jake',
      email: 'jake@mail.com',
    });

    const response = await request(app.getHttpServer())
      .post('/users')
      .auth(refereeAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  const createUser = async (dto: CreateUserDto, token: string) => {
    const expectedUser: User = { ...dto, id: expect.any(String) };

    const response = await request(app.getHttpServer())
      .post('/users')
      .auth(token, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(expectedUser);
    return response;
  }


  it('should update user', async () => {
    const dto: UpdateUserDto = MockCreateUserDto({
      firstName: 'Jaime',
      email: 'jaime@mail.com',
    });

    const expectedUser: User = { ...dto, id: referee.id };

    const response = await request(app.getHttpServer())
      .put(`/users/${referee.id}`)
      .auth(ownerAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(expectedUser);
    referee = response.body;

    const user: User = await getRepository(User).findOne({ where: { id: referee.id } });
    expect(referee).toMatchObject(user);
  });

  it('should not update user', async () => {
    const dto: UpdateUserDto = MockCreateUserDto({
      firstName: 'Jaime',
      email: 'jaime@mail.com',
    });

    const response = await request(app.getHttpServer())
      .put(`/users/${referee.id}`)
      .auth(adminAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should get all referees', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/referees')
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);

    const responseReferees: User[] = response.body;
    expect(responseReferees[0]).toMatchObject(referee);

    const dbReferees: User[] = await getRepository(User).find({ where: { role: Role.Referee } });
    expect(dbReferees).toHaveLength(1);
    expect(dbReferees[0]).toMatchObject(referee);
  });

  it('should not get all referees', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/referees')
      .auth(refereeAccessToken, { type: 'bearer' });
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should get all observers', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/observers')
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);

    const observers: User[] = response.body;
    expect(observers[0]).toMatchObject(observer);

    const dbObservers: User[] = await getRepository(User).find({ where: { role: Role.Observer } });
    expect(dbObservers).toHaveLength(1);
    expect(dbObservers[0]).toMatchObject(observer);
  });

  it('should not get all observers', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/observers')
      .auth(refereeAccessToken, { type: 'bearer' });
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should add league admin', async () => {
    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/admins/${admin.id}`)
      .auth(ownerAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(admin);

    const dbLeagueAdmins: User[] = (await getRepository(League).findOne({
      where: { id: mockLeague.id },
      relations: ['admins'],
    })).admins;
    expect(dbLeagueAdmins).toHaveLength(1);
    expect(dbLeagueAdmins[0]).toMatchObject(admin);
  });

  it('should not add league admin', async () => {
    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/admins/${admin.id}`)
      .auth(adminAccessToken, { type: 'bearer' });
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should add league observer', async () => {
    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/observers/${observer.id}`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(observer);

    const dbLeagueObservers: User[] = (await getRepository(League).findOne({
      where: { id: mockLeague.id },
      relations: ['observers']
    })).observers;
    expect(dbLeagueObservers).toHaveLength(1);
    expect(dbLeagueObservers[0]).toMatchObject(observer);
  });

  it('should not add league observer', async () => {
    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/observers/${observer.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should add league referee', async () => {
    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/referees/${referee.id}`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject(referee);

    const dbLeagueReferees: User[] = (await getRepository(League).findOne({
      where: { id: mockLeague.id },
      relations: ['referees'],
    })).referees;
    expect(dbLeagueReferees).toHaveLength(1);
    expect(dbLeagueReferees[0]).toMatchObject(referee);
  });

  it('should not add league referee', async () => {
    const response = await request(app.getHttpServer())
      .post(`/leagues/${mockLeague.id}/referees/${referee.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should remove league observer', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/observers/${observer.id}`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(observer);

    const dbLeagueObservers: User[] = (await getRepository(League).findOne({
      where: { id: mockLeague.id },
      relations: ['observers']
    })).observers;
    expect(dbLeagueObservers).toHaveLength(0);
  });

  it('should not remove league observer', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/observers/${observer.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should remove league referee', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/referees/${referee.id}`)
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(referee);

    const dbLeagueReferees: User[] = (await getRepository(League).findOne({
      where: { id: mockLeague.id },
      relations: ['referees']
    })).referees;
    expect(dbLeagueReferees).toHaveLength(0);
  });

  it('should not remove league referee', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/referees/${referee.id}`)
      .auth(refereeAccessToken, { type: 'bearer' });
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should remove league admin', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/admins/${admin.id}`)
      .auth(ownerAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(admin);

    const dbLeagueAdmins: User[] = (await getRepository(League).findOne({
      where: { id: mockLeague.id },
      relations: ['admins'],
    })).admins;
    expect(dbLeagueAdmins).toHaveLength(0);
  });

  it('should not remove league admin', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/leagues/${mockLeague.id}/admins/${admin.id}`)
      .auth(adminAccessToken, { type: 'bearer' });
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('should delete user', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/users/${admin.id}`)
      .auth(ownerAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);

    const users: User[] = await getRepository(User).find();
    expect(users).toHaveLength(3);
  });

  it('should not delete user', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/users/${admin.id}`)
      .auth(adminAccessToken, { type: 'bearer' });
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });
});
