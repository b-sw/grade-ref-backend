import { Injectable } from '@nestjs/common';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { UserParams } from '../users/params/UserParams';
import { uuid } from '../shared/types/uuid';
import { LeagueMatchParams } from './params/LeagueMatchParams';

@Injectable()
export class MatchesService {
  constructor(@InjectRepository(Match) private matchRepository: Repository<Match>) {}

  async createMatch(leagueId: uuid, dto: CreateMatchDto, leagueIdx: number, homeTeamIdx: number): Promise<Match> {
    const match: Match = this.matchRepository.create({
      matchDate: dto.matchDate,
      userReadableKey: this.getUserReadableKey(dto.matchDate, leagueIdx, homeTeamIdx),
      stadium: dto.stadium,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      refereeId: dto.refereeId,
      observerId: dto.observerId,
      leagueId: leagueId,
    });
    return this.matchRepository.save(match);
  }

  getUserReadableKey(dtoDate: Date, leagueIdx: number, homeTeamIdx: number) {
    dtoDate = new Date(dtoDate);
    const day: String = String(dtoDate.getDay()).slice(-2);
    const month: String = String(dtoDate.getMonth()).slice(-2);
    const year: String = String(dtoDate.getFullYear()).slice(-2);

    return day.padStart(2, '0') +
      month.padStart(2, '0') +
      year.padStart(2, '0') +
      String(leagueIdx).padStart(2, '0') +
      String(homeTeamIdx).padStart(2, '0');
  }

  async getAllMatches(): Promise<Match[]> {
    return this.matchRepository.find();
  }

  async getByLeague(leagueId: uuid): Promise<Match[]> {
    return this.matchRepository.find({ where: { leagueId: leagueId } });
  }

  async getById(matchId: uuid): Promise<Match> {
    return this.matchRepository.findOne({ where: { id: matchId } });
  }

  async updateMatch(params: LeagueMatchParams, dto: UpdateMatchDto, leagueIdx: number, homeTeamIdx: number): Promise<Match> {
    await this.matchRepository.update(params.matchId, {
      matchDate: dto.matchDate,
      userReadableKey: this.getUserReadableKey(dto.matchDate, leagueIdx, homeTeamIdx),
      stadium: dto.stadium,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      refereeId: dto.refereeId,
      observerId: dto.observerId
    });
    return this.getById(params.matchId);
  }

  async removeMatch(params: LeagueMatchParams): Promise<Match> {
    const match: Match = await this.getById(params.matchId);
    await this.matchRepository.delete(params.matchId);
    return match;
  }

  async getUserMatches(params: UserParams): Promise<Match[]> {
    return this.matchRepository.find({
      where: [
        { refereeId: params.userId },
        { observerId: params.userId }
      ]
    });
  }

  async updateGrade(params: LeagueMatchParams, dto: UpdateMatchDto): Promise<Match> {
    const match: Match = await this.getById(params.matchId);
    match.refereeGrade = dto.refereeGrade;
    match.refereeGradeDate = new Date();
    await this.matchRepository.save(match);
    return match;
  }
}
