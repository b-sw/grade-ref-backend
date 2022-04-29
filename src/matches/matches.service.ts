import { Injectable } from '@nestjs/common';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchParams } from './params/MatchParams';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { UserParams } from '../users/params/UserParams';

@Injectable()
export class MatchesService {
  constructor(@InjectRepository(Match) private matchRepository: Repository<Match>) {}

  async create(dto: CreateMatchDto) {
    const match: Match = this.matchRepository.create({
      date: dto.date,
      stadium: dto.stadium,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      refereeId: dto.refereeId,
      observerId: dto.observerId
    });
    return this.matchRepository.save(match);
  }

  async getAll() {
    return this.matchRepository.find();
  }

  async getById(params: MatchParams) {
    return this.matchRepository.findOne({ where: { id: params.id } });
  }

  async update(params: MatchParams, dto: UpdateMatchDto) {
    await this.matchRepository.update(params.id, {
      date: dto.date,
      stadium: dto.stadium,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
      refereeId: dto.refereeId,
      observerId: dto.observerId
    });
    return this.getById(params);
  }

  async remove(params: MatchParams) {
    const match: Match = await this.getById(params);
    await this.matchRepository.delete(params.id);
    return match;
  }

  async getUserMatches(params: UserParams) {
    return this.matchRepository.find({
      where: [
        { refereeId: params.id },
        { observerId: params.id }
      ]
    });
  }
}
