export class SmsGradeParams {
  message: GradeMessage
}

export interface GradeMessage {
  id: string;
  msisdn: string;
  msg: string;
}