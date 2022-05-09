import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Team } from '../entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeagueTeamParams } from './params/LeagueTeamParams';
import { uuid } from '../types/uuid';

@Injectable()
export class TeamsService {
  constructor(@InjectRepository(Team) private teamRepository: Repository<Team>) {}

  async create(leagueId: uuid, dto: CreateTeamDto) {
    const team: Team = this.teamRepository.create({
      name: dto.name,
      leagueId: leagueId
    });
    return this.teamRepository.save(team);
  }

  async getAll() {
    return this.teamRepository.find();
  }

  async getAllByLeagueId(leagueId: uuid) {
    return this.teamRepository.find({ where: { leagueId: leagueId } });
  }

  async getById(teamId: uuid) {
    return this.teamRepository.findOne({ where: { id: teamId } });
  }

  async update(params: LeagueTeamParams, dto: UpdateTeamDto) {
    await this.teamRepository.update(params.teamId, {
      name: dto.name
    });
    return this.getById(params.teamId);
  }

  async remove(params: LeagueTeamParams) {
    const team: Team = await this.getById(params.teamId);
    await this.teamRepository.delete(params.teamId);
    return team;
  }
}
