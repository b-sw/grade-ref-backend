import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamParams } from './params/TeamParams';
import { Team } from '../entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TeamsService {
  constructor(@InjectRepository(Team) private teamRepository: Repository<Team>) {}

  async create(dto: CreateTeamDto) {
    const team: Team = this.teamRepository.create({
      name: dto.name
    });
    return this.teamRepository.save(team);
  }

  async getAll() {
    return this.teamRepository.find();
  }

  async getById(params: TeamParams) {
    return this.teamRepository.findOne({ where: { id: params.id } });
  }

  async update(params: TeamParams, dto: UpdateTeamDto) {
    await this.teamRepository.update(params.id, { name: dto.name });
    return this.getById(params);
  }

  async remove(params: TeamParams) {
    const team: Team = await this.getById(params);
    await this.teamRepository.delete(params.id);
    return team;
  }
}
