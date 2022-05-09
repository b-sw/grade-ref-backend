import { Injectable } from '@nestjs/common';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { UserParams } from '../users/params/UserParams';
import { uuid } from '../types/uuid';
import { LeagueMatchParams } from './params/LeagueMatchParams';

@Injectable()
export class MatchesService {
  constructor(@InjectRepository(Match) private matchRepository: Repository<Match>) {}

  async create(leagueId: uuid, dto: CreateMatchDto) {
    const match: Match = this.matchRepository.create({
      date: dto.date,
      stadium: dto.stadium,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      refereeId: dto.refereeId,
      observerId: dto.observerId,
      leagueId: leagueId,
    });
    return this.matchRepository.save(match);
  }

  async getAll() {
    return this.matchRepository.find();
  }

  async getAllByLeagueId(leagueId: uuid) {
    return this.matchRepository.find({ where: { leagueId: leagueId } });
  }

  async getById(params: LeagueMatchParams) {
    return this.matchRepository.findOne({ where: { id: params.matchId } });
  }

  async update(params: LeagueMatchParams, dto: UpdateMatchDto) {
    await this.matchRepository.update(params.matchId, {
      date: dto.date,
      stadium: dto.stadium,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      refereeId: dto.refereeId,
      observerId: dto.observerId
    });
    return this.getById(params);
  }

  async remove(params: LeagueMatchParams) {
    const match: Match = await this.getById(params);
    await this.matchRepository.delete(params.matchId);
    return match;
  }

  async getUserMatches(params: UserParams) {
    return this.matchRepository.find({
      where: [
        { refereeId: params.userId },
        { observerId: params.userId }
      ]
    });
  }
}
