import { CreateMatchDto } from '../../src/matches/dto/create-match.dto';
import { Team } from '../../src/entities/team.entity';
import { User } from '../../src/entities/user.entity';
import dayjs, { Dayjs } from 'dayjs';
import { League } from '../../src/entities/league.entity';
import { v4 as randomUuid } from 'uuid';
import { getRepository } from 'typeorm';
import { Match } from '../../src/entities/match.entity';
import { uuid } from 'src/shared/types/uuid';

export const MockCreateMatchDto = (homeTeam: Team,
                                   awayTeam: Team,
                                   referee: User,
                                   observer: User): CreateMatchDto => {
  return {
    matchDate: new Date(dayjs().add(2, 'day').toDate()),
    stadium: 'Mock stadium',
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    refereeId: referee.id,
    observerId: observer.id,
    refereeGrade: null,
    refereeGradeDate: null,
    refereeSmsId: null,
    observerSmsId: null,
    refereeNote: null,
    overallGrade: null,
    overallGradeDate: null,
  }
}

export const MockMatch = (
  homeTeam: Team,
  awayTeam: Team,
  referee: User,
  observer: User,
  league: League,
): Match => {
  const dto: CreateMatchDto = MockCreateMatchDto(homeTeam, awayTeam, referee, observer);
  dto.overallGrade = 'Mock overall grade.';
  dto.overallGradeDate = new Date();

  return {
    ...dto,
    id: randomUuid(),
    leagueId: league.id,
    homeTeam: homeTeam,
    awayTeam: awayTeam,
    league: league,
    referee: referee,
    observer: observer,
    userReadableKey: `${homeTeam.name} vs ${awayTeam.name}`,
  };
}

export const setMockMatchDatetime = async (matchId: uuid, newDate: Dayjs): Promise<void> => {
  const matchRepository = await getRepository(Match);
  const match: Match = await matchRepository.findOne({ where: { id: matchId } });
  match.matchDate = new Date(newDate.format('YYYY-MM-DD HH:mm:ss'));
  await matchRepository.save(match);
}