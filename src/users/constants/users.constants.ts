import { Role } from '../../shared/types/role';
import { ReportType } from '../../matches/constants/matches.constants';

export enum ActionType {
  Read,
  Write,
}

export const GRADE_FILES_PERMISSIONS: Record<Role, Record<ActionType, Set<ReportType>>> = {
  [Role.Owner]: {
    [ActionType.Read]: new Set([ReportType.Observer, ReportType.Tv, ReportType.Mentor]),
    [ActionType.Write]: new Set(),
  },
  [Role.Admin]: {
    [ActionType.Read]: new Set([ReportType.Observer, ReportType.Tv, ReportType.Mentor]),
    [ActionType.Write]: new Set(),
  },
  [Role.Referee]: {
    [ActionType.Read]: new Set([ReportType.Observer, ReportType.Tv, ReportType.Mentor]),
    [ActionType.Write]: new Set([ReportType.Mentor, ReportType.Tv]),
  },
  [Role.Observer]: {
    [ActionType.Read]: new Set([ReportType.Observer]),
    [ActionType.Write]: new Set([ReportType.Observer]),
  },
};
