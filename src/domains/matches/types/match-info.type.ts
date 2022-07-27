import { uuid } from '../../../shared/constants/uuid.constant';

export type MatchInfo = {
  id: uuid;
  userReadableKey: string;
  matchDate: Date;
  stadium: string;
  homeTeam: string;
  awayTeam: string;
  referee: string;
  observer: string;
  leagueId: uuid;
  refereeGrade?: number;
  refereeGradeDate?: Date;
  refereeNote?: string;
  overallGrade?: string;
  overallGradeDate?: Date;
  observerReportKey?: string;
  mentorReportKey?: string;
  tvReportKey?: string;
};
