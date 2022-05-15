import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { Role } from '../../src/shared/types/role';
import { getRepository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { MockCreateUserDto, MockUser } from '../shared/MockUser';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import * as request from 'supertest';
import { UpdateUserDto } from '../../src/users/dto/update-user.dto';
import { League } from '../../src/entities/league.entity';
import { MockLeague } from '../shared/MockLeague';

describe('e2e scenario', () => {
  const mockUser: User = MockUser({ role: Role.Owner, email: 'mock@mail.com' });
  const mockLeague: League = MockLeague({});

  let app: INestApplication;
  let admin: User;
  let referee: User;
  let observer: User;
  let ownerAccessToken: string;
  let adminAccessToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await getRepository(User).insert(mockUser);
    // await getRepository(League).insert(mockLeague);
    const payload = { email: mockUser.email, sub: mockUser.id };
    ownerAccessToken = jwt.sign(payload, process.env.JWT_SECRET);
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
  });

  it('should create referee', async () => {
    const dto: CreateUserDto = MockCreateUserDto({
      role: Role.Referee,
      firstName: 'James',
      email: 'james@mail.com',
    });
    const response = await createUser(dto, ownerAccessToken);
    referee = response.body;
  });

  it('should create observer', async () => {
    const dto: CreateUserDto = MockCreateUserDto({
      role: Role.Observer,
      firstName: 'Jake',
      email: 'jake@mail.com',
    });
    const response = await createUser(dto, ownerAccessToken);
    observer = response.body;
  });

  const createUser = async (dto: CreateUserDto, token: string) => {
    const expectedUser: User = {...dto, id: expect.any(String)};

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

    const expectedUser: User = {...dto, id: referee.id};

    const response = await request(app.getHttpServer())
      .put(`/users/${referee.id}`)
      .auth(ownerAccessToken, { type: 'bearer' })
      .send(dto);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject(expectedUser);
    referee = response.body;
  });

  it('should get all referees', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/referees')
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);

    const referees: User[] = response.body;
    expect(referees[0]).toMatchObject(referee);
  });

  it('should get all observers', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/observers')
      .auth(adminAccessToken, { type: 'bearer' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveLength(1);

    const observers: User[] = response.body;
    expect(observers[0]).toMatchObject(observer);
  });

  // it('should add league admin', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post('/leagues')
  //     .auth(adminAccessToken, { type: 'bearer' })
  //     .send(mockLeague);
  //
  //   console.log('create league', response.body);
  //
  //   const response2 = await request(app.getHttpServer())
  //     .get('/leagues')
  //     .auth(ownerAccessToken, { type: 'bearer' });
  //
  //   console.log('get all leagues', response2.body);
  //   // const response = await request(app.getHttpServer())
  //   //   .post(`/leagues/${mockLeague.id}/admins/${admin.id}`)
  //   //   .auth(ownerAccessToken, { type: 'bearer' });
  //   //
  //   // expect(response.status).toBe(HttpStatus.CREATED);
  //   // expect(response.body).toHaveLength(1);
  //   //
  //   // const leagueAdmins: User[] = response.body;
  //   // expect(leagueAdmins[0]).toMatchObject(admin);
  // });

  // it('should add league observer', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post(`/leagues/${mockLeague.id}/observers/${observer.id}`)
  //     .auth(adminAccessToken, { type: 'bearer' });;
  //
  //   expect(response.status).toBe(HttpStatus.CREATED);
  //   expect(response.body).toHaveLength(1);
  //
  //   const leagueObservers: User[] = response.body;
  //   expect(leagueObservers[0]).toMatchObject(observer);
  // });
  //
  // it('should add league referee', async () => {
  //   const response = await request(app.getHttpServer())
  //     .post(`/leagues/${mockLeague.id}/referees/${referee.id}`)
  //     .auth(adminAccessToken, { type: 'bearer' });;
  //
  //   expect(response.status).toBe(HttpStatus.CREATED);
  //   expect(response.body).toHaveLength(1);
  //
  //   const leagueReferees: User[] = response.body;
  //   expect(leagueReferees[0]).toMatchObject(referee);
  // });

  // it('should remove league observer', async () => {
  //
  // });
  //
  // it('should remove league referee', async () => {
  //
  // });
  //
  // it('should remove league admin', async () => {
  //
  // });
  //
  // it('should delete user', async () => {
  //
  // });
});
