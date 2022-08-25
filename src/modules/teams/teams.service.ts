import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateTeamDto } from 'src/modules/teams/dto/update-team.dto';
import { Team } from 'src/entities/team.entity';
import { CreateTeamDto } from 'src/modules/teams/dto/create-team.dto';
import { LeagueTeamParams } from 'src/modules/teams/params/LeagueTeamParams';
import { uuid } from 'src/shared/types/uuid.type';

@Injectable()
export class TeamsService {
  constructor(@InjectRepository(Team) private teamRepository: Repository<Team>) {}

  async create(leagueId: uuid, dto: CreateTeamDto) {
    await this.validateUnique(dto);
    const team: Team = this.teamRepository.create({
      name: dto.name,
      leagueId: leagueId,
    });
    return this.teamRepository.save(team);
  }

  async getAll() {
    return this.teamRepository.find();
  }

  async getAllByLeagueId(leagueId: uuid): Promise<Team[]> {
    return this.teamRepository.find({ where: { leagueId: leagueId } });
  }

  async getById(teamId: uuid): Promise<Team> {
    return this.teamRepository.findOne({ where: { id: teamId } });
  }

  async update(params: LeagueTeamParams, dto: UpdateTeamDto): Promise<Team> {
    await this.validateUnique(dto, params.teamId);
    await this.teamRepository.update(params.teamId, {
      name: dto.name,
    });
    return this.getById(params.teamId);
  }

  async remove(params: LeagueTeamParams): Promise<Team> {
    const team: Team = await this.getById(params.teamId);
    await this.teamRepository.delete(params.teamId);
    return team;
  }

  async validateUnique(dto: CreateTeamDto | UpdateTeamDto, id?: uuid): Promise<void> {
    const existingTeam: Team | undefined = await this.teamRepository.findOne({
      where: { name: dto.name },
    });

    if (!existingTeam) {
      return;
    }

    if (!id || id !== existingTeam.id) {
      throw new HttpException(`Team name '` + dto.name + `' is not unique.`, HttpStatus.BAD_REQUEST);
    }
  }
}
