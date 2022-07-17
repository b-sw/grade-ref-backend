import { Injectable } from '@nestjs/common';
import { CreateFoulDto } from './dto/create-foul.dto';
import { UpdateFoulDto } from './dto/update-foul.dto';
import { uuid } from '../shared/constants/uuid.constant';
import { Foul } from '../entities/foul.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getNotNull } from '../shared/getters';

@Injectable()
export class FoulsService {
  constructor(@InjectRepository(Foul) private foulRepository: Repository<Foul>) {}

  async create(dto: CreateFoulDto, matchId: uuid): Promise<Foul> {
    const foul: Foul = await this.foulRepository.create({
      matchId: matchId,
      minute: dto.minute,
      card: dto.card,
      playerNumber: dto.playerNumber,
      description: dto.description,
      valid: dto.valid,
      teamId: dto.teamId,
    });
    return this.foulRepository.save(foul);
  }

  async getById(foulId: uuid): Promise<Foul | undefined> {
    return getNotNull(await this.foulRepository.findOne({ where: { id: foulId } }));
  }

  async getByMatch(matchId: uuid): Promise<Foul[]> {
    return getNotNull(await this.foulRepository.find({
      where: { matchId: matchId },
      order: { minute: 'ASC' }
    }));
  }

  async update(foulId: uuid, dto: UpdateFoulDto): Promise<Foul> {
    await this.foulRepository.update(foulId, {
      minute: dto.minute,
      card: dto.card,
      playerNumber: dto.playerNumber,
      description: dto.description,
      valid: dto.valid,
      teamId: dto.teamId,
    });
    return await this.getById(foulId);
  }

  async remove(foulId: uuid): Promise<Foul> {
    const foul: Foul = getNotNull(await this.getById(foulId));
    await this.foulRepository.delete(foulId);
    return foul;
  }
}
