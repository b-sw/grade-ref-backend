import { Injectable } from '@nestjs/common';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { LeagueParams } from './params/LeagueParams';
import { InjectRepository } from '@nestjs/typeorm';
import { League } from '../entities/league.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LeaguesService {
  constructor(@InjectRepository(League) private leagueRepository: Repository<League>) {}

  async create(dto: CreateLeagueDto) {
    const league: League = this.leagueRepository.create({
      name: dto.name,
      shortName: dto.shortName,
      country: dto.country,
    });
    return this.leagueRepository.save(league);
  }

  async getAll() {
    return this.leagueRepository.find();
  }

  async getById(params: LeagueParams) {
    return this.leagueRepository.findOne({ where: { id: params.leagueId } });
  }

  async update(params: LeagueParams, dto: UpdateLeagueDto) {
    await this.leagueRepository.update(params.leagueId, {
      name: dto.name,
      shortName: dto.shortName,
      country: dto.country
    });
    return this.getById(params);
  }

  async remove(params: LeagueParams) {
    const league: League = await this.getById(params);
    await this.leagueRepository.delete(params.leagueId);
    return league;
  }
}
