import { League } from '../../src/entities/league.entity';
import { CreateLeagueDto } from '../../src/leagues/dto/create-league.dto';
import { v4 as randomUuid } from 'uuid';

const BaseCreateLeagueDto: CreateLeagueDto = {
  name: 'Mock League',
  shortName: 'PML',
  country: 'Poland',
}

const BaseLeague: League = { ...BaseCreateLeagueDto, id: randomUuid(), observers: [], referees: [], admins: [] }

export const MockCreateLeagueDto = (overwrite: Partial<CreateLeagueDto>): CreateLeagueDto => {
  return { ...BaseCreateLeagueDto, ...overwrite };
}

export const MockLeague = (overwrite: Partial<League>): League => {
  return { ...BaseLeague, ...overwrite };
}
