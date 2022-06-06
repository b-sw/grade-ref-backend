import { Injectable} from '@nestjs/common';
import axios from "axios";
import * as dayjs from 'dayjs'
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { UserParams } from '../users/params/UserParams';
import { uuid } from '../shared/types/uuid';
import { LeagueMatchParams } from './params/LeagueMatchParams';
import { LeagueUserParams } from '../leagues/params/LeagueUserParams';

const SMS_API: string = 'https://api2.smsplanet.pl';
export const DTO_DATETIME_FORMAT: string = 'YYYY-MM-DDThh:mm';
const SMS_API_DATETIME_FORMAT: string = 'DD-MM-YYYY HH:mm:ss';

@Injectable()
export class MatchesService {
  constructor(@InjectRepository(Match) private matchRepository: Repository<Match>) {}

  async createMatch(leagueId: uuid, dto: CreateMatchDto, leagueIdx: number, homeTeamIdx: number, observerPhoneNumber: string): Promise<Match> {
    const matchKey: string = this.getUserReadableKey(dto.matchDate, leagueIdx, homeTeamIdx);
    const observerSmsId: string = await this.planSms(dto.matchDate, matchKey, observerPhoneNumber)

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

  async getById(matchId: uuid): Promise<Match> {
    return this.matchRepository.findOne({ where: { id: matchId } });
  }

  async updateMatch(params: LeagueMatchParams, dto: UpdateMatchDto, leagueIdx: number, homeTeamIdx: number, observerPhoneNumber: string): Promise<Match> {
    await this.cancelSMS(dto.observerSmsId)
    const matchKey: string = this.getUserReadableKey(dto.matchDate, leagueIdx, homeTeamIdx);
    const observerSmsId: string = await this.planSms(dto.matchDate, matchKey, observerPhoneNumber)

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

  async removeMatch(params: LeagueMatchParams): Promise<Match> {
    const match: Match = await this.getById(params.matchId);
    await this.cancelSMS(match.observerSmsId);
    await this.matchRepository.delete(params.matchId);
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
    const match: Match = await this.getById(params.matchId);
    match.refereeGrade = dto.refereeGrade;
    match.refereeGradeDate = new Date();
    await this.matchRepository.save(match);
    return match;
  }

  async planSms(dtoDate: Date, messageKey: string, phoneNumber: string): Promise<string> {
    const matchDate: string = dayjs(dtoDate, DTO_DATETIME_FORMAT).format(SMS_API_DATETIME_FORMAT);
    const sendDate: string = dayjs(dtoDate, DTO_DATETIME_FORMAT).subtract(1, 'day').format(SMS_API_DATETIME_FORMAT);

    const response = await axios.post(`${SMS_API}/sms`, {}, {
      params: {
        key: process.env.SMS_API_KEY,
        password: process.env.SMS_PASSWORD,
        from: process.env.SMS_NUMBER,
        to: phoneNumber,
        msg: `Nowa obsada, mecz ${messageKey}, ${matchDate}. Po zakończeniu spotkania wyślij sms o treści: ID_meczu#ocena/ocena`,
        date: sendDate
      }
    });

    console.log('response is', response);

    return response.data.messageId.toString();
  }

  // todo: check return type in external api
  async cancelSMS(smsId : string): Promise<void> {
    let smsIdInt: number = +smsId;

    await axios.post(`${SMS_API}/cancelMessage`, {}, {
      params: {
        key: process.env.SMS_API_KEY,
        password: process.env.SMS_PASSWORD,
        messageId: smsIdInt,
      }
    });
  }
}
