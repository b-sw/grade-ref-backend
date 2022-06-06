import { CreateMatchDto } from '../../src/matches/dto/create-match.dto';
import { Team } from '../../src/entities/team.entity';
import { User } from '../../src/entities/user.entity';
import * as dayjs from 'dayjs';

export const MockCreateMatchDto = (teamA: Team,
                                   teamB: Team,
                                   referee: User,
                                   observer: User,
                                   stadium?: string): CreateMatchDto => {
  return {
    matchDate: new Date(dayjs().add(2, 'day').toDate()),
    stadium: stadium ?? 'Mock stadium',
    homeTeamId: teamA.id,
    awayTeamId: teamB.id,
    refereeId: referee.id,
    observerId: observer.id,
    refereeGrade: null,
    refereeGradeDate: null,
    refereeSmsId: null,
    observerSmsId: null,
  }
}