import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { LeagueParams } from './params/LeagueParams';
import { InjectRepository } from '@nestjs/typeorm';
import { League } from '../entities/league.entity';
import { In, Repository } from 'typeorm';
import { uuid } from '../shared/types/uuid';
import { User } from '../entities/user.entity';
import { LeagueUserParams } from './params/LeagueUserParams';

@Injectable()
export class LeaguesService {
  constructor(
    @InjectRepository(League) private leagueRepository: Repository<League>,
  ) {}

  async createLeague(
    initialLeagueAdmin: User,
    dto: CreateLeagueDto,
  ): Promise<League> {
    await this.validateUnique(dto);
    const league: League = this.leagueRepository.create({
      name: dto.name,
      shortName: dto.shortName,
      country: dto.country,
      admins: [initialLeagueAdmin],
      referees: [],
      observers: [],
    });
    return this.leagueRepository.save(league);
  }

  async getLeagues(): Promise<League[]> {
    return this.leagueRepository.find({
      relations: ['admins', 'referees', 'observers'],
    });
  }

  async getLeaguesByUser(user: User): Promise<League[]> {
    const tables = {
      Admin: 'admins',
      Referee: 'referees',
      Observer: 'observers',
    };
    const table: string = tables[user.role];
    let query = this.leagueRepository.createQueryBuilder('league');
    query.innerJoinAndSelect(`league.${table}`, `${table}Alias`);
    query.where(`${table}Alias.id = :userId`, { userId: user.id });
    query.select('league.id');

    const ids = (await query.getMany()).map((league) => league.id);
    return this.leagueRepository.find({ where: { id: In(ids) } });
  }

  async getLeagueById(leagueId: uuid): Promise<League> {
    return this.leagueRepository.findOne({
      where: { id: leagueId },
      relations: ['admins', 'referees', 'observers'],
    });
  }

  async updateLeague(
    params: LeagueParams,
    dto: UpdateLeagueDto,
  ): Promise<League> {
    await this.validateUnique(dto, params.leagueId);
    await this.leagueRepository.update(params.leagueId, {
      name: dto.name,
      shortName: dto.shortName,
      country: dto.country,
    });
    return this.getLeagueById(params.leagueId);
  }

  async removeLeague(params: LeagueParams): Promise<League> {
    const league: League = await this.getLeagueById(params.leagueId);
    await this.leagueRepository.delete(params.leagueId);
    return league;
  }

  async getLeagueReferees(leagueId: uuid): Promise<User[]> {
    const league: League = await this.getLeagueById(leagueId);
    return league.referees;
  }

  async getLeagueObservers(leagueId: uuid): Promise<User[]> {
    const league: League = await this.getLeagueById(leagueId);
    return league.observers;
  }

  async getLeagueAdmins(leagueId: uuid) {
    const league: League = await this.getLeagueById(leagueId);
    return league.admins;
  }

  async assignRefereeToLeague(
    params: LeagueUserParams,
    user: User,
  ): Promise<User> {
    const league: League = await this.getLeagueById(params.leagueId);
    league.referees.push(user);
    await this.leagueRepository.save(league);
    return user;
  }

  async assignObserverToLeague(
    params: LeagueUserParams,
    user: User,
  ): Promise<User> {
    const league: League = await this.getLeagueById(params.leagueId);
    league.observers.push(user);
    await this.leagueRepository.save(league);
    return user;
  }

  async assignAdminToLeague(
    params: LeagueUserParams,
    user: User,
  ): Promise<User> {
    const league: League = await this.getLeagueById(params.leagueId);
    league.admins.push(user);
    await this.leagueRepository.save(league);
    return user;
  }

  async removeRefereeFromLeague(
    params: LeagueUserParams,
    user: User,
  ): Promise<User> {
    const league: League = await this.getLeagueById(params.leagueId);
    league.referees = league.referees.filter(
      (referee) => referee.id !== user.id,
    );
    await this.leagueRepository.save(league);
    return user;
  }

  async removeObserverFromLeague(
    params: LeagueUserParams,
    user: User,
  ): Promise<User> {
    const league: League = await this.getLeagueById(params.leagueId);
    league.observers = league.observers.filter(
      (observer) => observer.id !== user.id,
    );
    await this.leagueRepository.save(league);
    return user;
  }

  async removeAdminFromLeague(
    params: LeagueUserParams,
    user: User,
  ): Promise<User> {
    const league: League = await this.getLeagueById(params.leagueId);
    league.admins = league.admins.filter((admin) => admin.id !== user.id);
    await this.leagueRepository.save(league);
    return user;
  }

  async validateUnique(
    dto: CreateLeagueDto | UpdateLeagueDto,
    id?: uuid,
  ): Promise<void> {
    const existingLeague: League | undefined =
      await this.leagueRepository.findOne({
        where: [{ name: dto.name }, { shortName: dto.shortName }],
      });

    if (!existingLeague) {
      return;
    }

    if (!id || id !== existingLeague.id) {
      throw new HttpException(
        'League name or short name not unique',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
