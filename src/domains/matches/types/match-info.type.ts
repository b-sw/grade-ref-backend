import { uuid } from '../../../shared/constants/uuid.constant';

export type MatchInfo = {
  id: uuid;
  userReadableKey: string;
  matchDate: Date;
  stadium: string;
  homeTeamId: uuid;
  awayTeamId: uuid;
  referee: string;
  observer: string;
  leagueId: uuid;
  refereeGrade?: string;
  refereeGradeDate?: Date;
  refereeNote?: string;
  overallGrade?: string;
  overallGradeDate?: Date;
  observerReportKey?: string;
  mentorReportKey?: string;
  tvReportKey?: string;
  selfReportKey?: string;
};
