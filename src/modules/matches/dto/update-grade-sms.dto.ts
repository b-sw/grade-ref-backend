export class UpdateGradeSmsDto {
  message: GradeMessage;
}

export interface GradeMessage {
  id: string;
  msisdn: string;
  msg: string;
}
