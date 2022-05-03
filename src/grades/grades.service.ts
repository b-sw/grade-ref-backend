import { Injectable } from '@nestjs/common';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeParams } from './params/GradeParams';
import { Grade } from '../entities/grade.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserParams } from '../users/params/UserParams';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';
import { Role } from '../types/role';
import { MatchesService } from '../matches/matches.service';
import { uuid } from '../types/uuid';

@Injectable()
export class GradesService {
  constructor(@InjectRepository(Grade) private gradeRepository: Repository<Grade>,
              private usersService: UsersService,
              private matchesService: MatchesService) {}

  async create(params: UserParams, dto: CreateGradeDto) {
    const grade: Grade = this.gradeRepository.create({
      date: dto.date,
      matchId: dto.matchId,
      observerId: params.userId,
      value: dto.value
    });
    return this.gradeRepository.save(grade);
  }

  async getAll() {
    return this.gradeRepository.find();
  }

  async getById(params: GradeParams) {
    return this.gradeRepository.findOne({ where: { id: params.gradeId } });
  }

  async update(params: GradeParams, dto: UpdateGradeDto) {
    await this.gradeRepository.update(params.gradeId, {
      date: dto.date,
      matchId: dto.matchId,
      observerId: params.userId,
      value: dto.value
    });
    return this.getById(params);
  }

  async remove(params: GradeParams) {
    const grade: Grade = await this.getById(params);
    await this.gradeRepository.delete(params.gradeId);
    return grade;
  }

  async getUserGrades(params: UserParams) {
    const user: User = await this.usersService.getById(params.userId);

    if (user.role === Role.Observer) {
      return this.gradeRepository.find({
        where:
          { observerId: params.userId }
      });
    }

    const refereeMatchesIds: uuid[] = (await this.matchesService.getUserMatches({ userId: user.id } as UserParams))
      .map((match) => match.id);
    return this.gradeRepository.find({ where: { matchId: In(refereeMatchesIds) } });
  }
}
