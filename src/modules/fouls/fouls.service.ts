import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Foul } from 'src/entities/foul.entity';
import { getNotNull } from 'src/shared/getters';
import { UpdateFoulDto } from 'src/modules/fouls/dto/update-foul.dto';
import { CreateFoulDto } from 'src/modules/fouls/dto/create-foul.dto';
import { uuid } from 'src/shared/types/uuid.type';

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
    return getNotNull(
      await this.foulRepository.find({
        where: { matchId: matchId },
        order: { minute: 'ASC' },
      }),
    );
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
