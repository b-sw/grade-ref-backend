import { ApiProperty } from '@nestjs/swagger';
import { LeagueMatchParams } from './LeagueMatchParams';
import { ReportType } from '../constants/matches.constants';

export class LeagueMatchReportParams extends LeagueMatchParams {
  @ApiProperty({ type: ReportType })
  reportType: ReportType;
}
