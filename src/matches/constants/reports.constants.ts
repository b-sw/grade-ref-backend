import { ReportType } from './matches.constants';

export const ReportFieldNames = {
  [ReportType.Observer]: 'mentorReportKey',
  [ReportType.Mentor]: 'observerReportKey',
  [ReportType.Tv]: 'tvReportKey',
}