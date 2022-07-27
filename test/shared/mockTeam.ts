import { CreateTeamDto } from '../../src/domains/teams/dto/create-team.dto';
import { Team } from '../../src/entities/team.entity';
import { uuid } from '../../src/shared/constants/uuid.constant';
import { League } from '../../src/entities/league.entity';
import { v4 as randomUuid } from 'uuid';

const BaseCreateTeamDto: CreateTeamDto = {
  name: 'FC Mock Team',
};

export const MockCreateTeamDto = (overwrite: Partial<CreateTeamDto>): CreateTeamDto => {
  return { ...BaseCreateTeamDto, ...overwrite };
};

export const MockTeam = (leagueId: uuid, league: League, name?: string, id?: uuid): Team => {
  return {
    id: id ?? randomUuid(),
    name: name ?? BaseCreateTeamDto.name,
    leagueId: leagueId,
    league: league,
  };
};
