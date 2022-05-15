import { CreateTeamDto } from '../../src/teams/dto/create-team.dto';

const BaseCreateTeamDto: CreateTeamDto = {
  name: 'FC Mock Team',
}

export const MockCreateTeamDto = (overwrite: Partial<CreateTeamDto>): CreateTeamDto => {
  return { ...BaseCreateTeamDto, ...overwrite };
}
