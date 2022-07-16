import { ApiProperty } from '@nestjs/swagger';
import { ReportType } from 'src/entities/match.entity';
import { uuid } from '../../shared/types/uuid';
import { LeagueMatchParams } from './LeagueMatchParams';

export class LeagueMatchReportParams extends LeagueMatchParams {
  @ApiProperty({ type: ReportType })
  reportType: ReportType;
}
