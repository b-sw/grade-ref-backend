import { ApiProperty } from '@nestjs/swagger';
import { LeagueMatchParams } from 'src/modules/matches/params/LeagueMatchParams';
import { ReportType } from 'src/modules/matches/constants/matches.constants';

export class LeagueMatchReportParams extends LeagueMatchParams {
    @ApiProperty({ type: ReportType })
    reportType: ReportType;
}
