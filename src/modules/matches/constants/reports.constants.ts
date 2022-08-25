import { ReportType } from 'src/modules/matches/constants/matches.constants';

export const ReportFieldNames = {
  [ReportType.Observer]: 'observerReportKey',
  [ReportType.Mentor]: 'mentorReportKey',
  [ReportType.Tv]: 'tvReportKey',
  [ReportType.Self]: 'selfReportKey',
};
