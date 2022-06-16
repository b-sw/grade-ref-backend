import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException
} from '@nestjs/common';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { UserParams } from '../users/params/UserParams';
import { uuid } from '../shared/types/uuid';
import { LeagueMatchParams } from './params/LeagueMatchParams';
import { LeagueUserParams } from '../leagues/params/LeagueUserParams';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { User } from '../entities/user.entity';
import { GradeMessage } from './dto/update-grade-sms.dto';
import { getNotNull } from '../shared/getters';

const SMS_API: string = 'https://api2.smsplanet.pl';
export const DTO_DATETIME_FORMAT: string = 'YYYY-MM-DDThh:mm';
const SMS_API_DATETIME_FORMAT: string = 'DD-MM-YYYY HH:mm:ss';

@Injectable()
export class MatchesService {
  constructor(@InjectRepository(Match) private matchRepository: Repository<Match>) {}

  async createMatch(leagueId: uuid, dto: CreateMatchDto, leagueIdx: number, homeTeamIdx: number, observerPhoneNumber: string): Promise<Match> {
    await this.validateMatch(dto);
    const matchKey: string = this.getUserReadableKey(dto.matchDate, leagueIdx, homeTeamIdx);
    const observerSmsId: string = await this.scheduleSms(dto.matchDate, matchKey, observerPhoneNumber)

    const match: Match = this.matchRepository.create({
      matchDate: dto.matchDate,
      userReadableKey: this.getUserReadableKey(dto.matchDate, leagueIdx, homeTeamIdx),
      stadium: dto.stadium,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      refereeId: dto.refereeId,
      observerId: dto.observerId,
      leagueId: leagueId,
      observerSmsId: observerSmsId,
    });
    return this.matchRepository.save(match);
  }

  getUserReadableKey(dtoDate: Date, leagueIdx: number, homeTeamIdx: number) {
    dtoDate = new Date(dtoDate);
    /*
     *  + 1 because JavaScript's Date is a copy of Java's java.util.Date
     */
    const day: String = String(dtoDate.getUTCDate()).slice(-2);
    const month: String = String(dtoDate.getUTCMonth() + 1).slice(-2);
    const year: String = String(dtoDate.getUTCFullYear()).slice(-2);
    return day.padStart(2, '0') +
      month.padStart(2, '0') +
      year.padStart(2, '0') +
      String(leagueIdx + 1).padStart(2, '0') +
      String(homeTeamIdx + 1).padStart(2, '0');
  }

  async getAllMatches(): Promise<Match[]> {
    return this.matchRepository.find();
  }

  async getByLeague(leagueId: uuid): Promise<Match[]> {
    return this.matchRepository.find({ where: { leagueId: leagueId }, order: { matchDate: 'DESC' } });
  }

  async getById(matchId: uuid): Promise<Match | undefined> {
    return this.matchRepository.findOne({ where: { id: matchId } });
  }

  async getByUserReadableKey(key: string): Promise<Match | undefined> {
    return this.matchRepository.findOne({ where: { userReadableKey: key } });
  }

  async updateMatch(params: LeagueMatchParams, dto: UpdateMatchDto, leagueIdx: number, homeTeamIdx: number, observerPhoneNumber: string): Promise<Match> {
    await this.validateMatch(dto, params.matchId);
    const match: Match = getNotNull(await this.getById(params.matchId));
    await this.cancelSMS(match.observerSmsId);
    const matchKey: string = this.getUserReadableKey(dto.matchDate, leagueIdx, homeTeamIdx);
    const observerSmsId: string = await this.scheduleSms(dto.matchDate, matchKey, observerPhoneNumber)

    await this.matchRepository.update(params.matchId, {
      matchDate: dto.matchDate,
      userReadableKey: this.getUserReadableKey(dto.matchDate, leagueIdx, homeTeamIdx),
      stadium: dto.stadium,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      refereeId: dto.refereeId,
      observerId: dto.observerId,
      observerSmsId: observerSmsId
    });
    return this.getById(params.matchId);
  }

  async removeMatch(params: LeagueMatchParams, phoneNumber: string): Promise<Match> {
    const match: Match = getNotNull(await this.getById(params.matchId));
    await this.cancelSMS(match.observerSmsId);
    await this.matchRepository.delete(params.matchId);
    await this.sendOneWaySms(phoneNumber, `Cannot enter a grade before match end.`);
    return match;
  }

  async getUserMatches(params: UserParams): Promise<Match[]> {
    return this.matchRepository.find({
      where: [
        { refereeId: params.userId },
        { observerId: params.userId }
      ],
      order: { matchDate: 'DESC' }
    });
  }

  async getUserLeagueMatches(params: LeagueUserParams): Promise<Match[]> {
    return this.matchRepository.find({
      where: [
        { refereeId: params.userId, leagueId: params.leagueId },
        { observerId: params.userId, leagueId: params.leagueId }
      ],
      order: { matchDate: 'DESC' }
    });
  }

  async updateGrade(params: LeagueMatchParams, dto: UpdateMatchDto): Promise<Match> {
    const match: Match = getNotNull(await this.getById(params.matchId));
    match.refereeGrade = dto.refereeGrade;
    match.refereeGradeDate = new Date();
    await this.matchRepository.save(match);
    return match;
  }

  async updateGradeSms(gradeMessage: GradeMessage, observer: User): Promise<void> {
    if (!(await this.requireSmsValid(gradeMessage.msg, observer.phoneNumber))) {
      return;
    }

    const matchKey: string = gradeMessage.msg.split('#')[0];
    const match: Match | undefined = await this.getByUserReadableKey(matchKey);

    if (!(await this.requireSmsMatchKeyValid(match, observer.phoneNumber))) {
      return;
    }

    if (!(await this.requireSmsGradeValid(gradeMessage.msg, observer.phoneNumber))) {
      return;
    }

    match.refereeGrade = +gradeMessage.msg.split('#')[1].split('/')[0];
    match.refereeGradeDate = new Date();
    await this.matchRepository.save(match);
    await this.sendOneWaySms(observer.phoneNumber, `Grade for match ${match.userReadableKey} has been entered.`);
  }

  async requireSmsValid(smsText: string, phoneNumber: string): Promise<boolean> {
    let smsElems: string[];

    try {
      smsElems = smsText.split('#');
    } catch (_e) {
      await this.sendOneWaySms(phoneNumber, 'Invalid sms format.');
      return false;
    }

    if (smsElems.length !== 2) {
      await this.sendOneWaySms(phoneNumber, 'Invalid sms format.');
      return false;
    }

    const matchKey: string = smsElems[0];

    if (!matchKey) {
      await this.sendOneWaySms(phoneNumber, `Invalid match key.`);
      return false;
    }

    let gradeElems: string[];
    try {
      gradeElems = smsElems[1].split('/');
    } catch (_e) {
      await this.sendOneWaySms(phoneNumber, 'Invalid sms grade format.');
      return false;
    }

    if (gradeElems.length !== 2) {
      await this.sendOneWaySms(phoneNumber, 'Invalid sms grade format.');
      return false;
    }

    const grade: number = +gradeElems[0];
    if (isNaN(grade)) {
      await this.sendOneWaySms(phoneNumber, `Invalid grade.`);
      return false;
    }
    return true;
  }

  async requireSmsMatchKeyValid(match: Match | undefined, phoneNumber: string): Promise<boolean> {
    if (!match) {
      await this.sendOneWaySms(phoneNumber, `Invalid match key.`);
      return false;
    }

    if (match.refereeGrade) {
      await this.sendOneWaySms(phoneNumber, `Grade has already been entered.`);
      return false;
    }

    if(dayjs().isBefore(dayjs(match.matchDate).add(2, 'hour'))) {
      await this.sendOneWaySms(phoneNumber, `Cannot enter a grade before match end.`);
      return false;
    }
    return true;
  }

  async requireSmsGradeValid(smsText: string, phoneNumber: string): Promise<boolean> {
    let grade: number;
    try {
      grade = +smsText.split('#')[1].split('/')[0];
    } catch (_e) {
      await this.sendOneWaySms(phoneNumber, `Invalid sms grade format.`);
      return false;
    }

    if (isNaN(grade)) {
      await this.sendOneWaySms(phoneNumber, `Invalid grade.`);
      return false;
    }
    return true;
  }

  async validateMatch(dto: CreateMatchDto, existingId?: uuid) {
    const matchDate: Dayjs = dayjs(dto.matchDate);

    const existingMatch: Match | undefined = await this.matchRepository.findOne({
      where: [
        {
          matchDate: Between(matchDate.startOf('day').toDate(), matchDate.endOf('day').toDate()),
          homeTeamId: In([dto.homeTeamId, dto.awayTeamId]),
        },
        {
          matchDate: Between(matchDate.startOf('day').toDate(), matchDate.endOf('day').toDate()),
          awayTeamId: In([dto.homeTeamId, dto.awayTeamId]),
        }
      ]
    });

    if (dto.homeTeamId === dto.awayTeamId) {
      throw new HttpException(`Home team same as away team`, HttpStatus.BAD_REQUEST);
    }

    if (existingMatch && existingMatch.id !== existingId) {
      throw new HttpException(`One of the teams already has a match at that day`, HttpStatus.BAD_REQUEST);
    }
  }

  async scheduleSms(dtoDate: Date, messageKey: string, phoneNumber: string): Promise<string> {
    const matchDate: string = dayjs(dtoDate, DTO_DATETIME_FORMAT).format(SMS_API_DATETIME_FORMAT);
    const sendDate: string = dayjs(dtoDate, DTO_DATETIME_FORMAT).subtract(1, 'day').format(SMS_API_DATETIME_FORMAT);

    const response: AxiosResponse = await axios.post(`${SMS_API}/sms`, {}, {
      params: {
        key: process.env.SMS_API_KEY,
        password: process.env.SMS_PASSWORD,
        from: process.env.SMS_NUMBER,
        to: phoneNumber,
        msg: `Nowa obsada, mecz ${messageKey}, ${matchDate}. Po zakończeniu spotkania wyślij sms o treści: ID_meczu#ocena/ocena`,
        date: sendDate
      }
    });

    if (response.status != HttpStatus.OK) {
      throw new ServiceUnavailableException('SMS API error: ', response.data);
    }

    return response.data.messageId.toString();
  }

  async cancelSMS(smsId : string): Promise<void> {
    let smsIdInt: number = +smsId;

    const response = await axios.post(`${SMS_API}/cancelMessage`, {}, {
      params: {
        key: process.env.SMS_API_KEY,
        password: process.env.SMS_PASSWORD,
        messageId: smsIdInt,
      }
    });
    if (response.status != HttpStatus.OK) {
      throw new ServiceUnavailableException('SMS API error: ', response.data);
    }
  }

  async sendOneWaySms(recipient: string, message: string): Promise<void> {
    const response: AxiosResponse = await axios.post(`${SMS_API}/sms`, {}, {
      params: {
        key: process.env.SMS_API_KEY,
        password: process.env.SMS_PASSWORD,
        from: process.env.SMS_SENDER,
        to: recipient,
        msg: message,
      }
    });
    if (response.status != HttpStatus.OK) {
      throw new ServiceUnavailableException('SMS API error: ', response.data);
    }
  }
}
