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

  async createMatch(leagueId: uuid, dto: CreateMatchDto): Promise<Match> {
    const match: Match = this.matchRepository.create({
      matchDate: dto.matchDate,
      stadium: dto.stadium,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      refereeId: dto.refereeId,
      observerId: dto.observerId,
      leagueId: leagueId,
    });
    return this.matchRepository.save(match);
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

  async updateMatch(params: LeagueMatchParams, dto: UpdateMatchDto): Promise<Match> {
    await this.matchRepository.update(params.matchId, {
      matchDate: dto.matchDate,
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
    await this.matchRepository.save(match);
    return match;
  }
}
