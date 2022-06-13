import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class MatchGradeGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const dto = request.body;
    console.log('request body in guard is', dto);

    // if (!dto.message || !dto.message.msisdn || !dto.message.id) {
    //   throw new HttpException('Invalid body.', HttpStatus.BAD_REQUEST);
    // }
    //
    // const observer: User | undefined = await this.usersService.getByPhoneNumber(dto.message.msisdn);
    // const match: Match | undefined = await this.matchesService.getByObserverSmsId(dto.message.id);
    //
    // if (!observer || !match || observer.id !== match.observerId) {
    //   throw new HttpException('Forbidden.', HttpStatus.FORBIDDEN);
    // }
    return true;
  }
}