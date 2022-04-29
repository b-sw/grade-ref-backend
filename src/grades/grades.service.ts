import { Injectable } from '@nestjs/common';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeParams } from './params/GradeParams';
import { Grade } from '../entities/grade.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserParams } from '../users/params/UserParams';

@Injectable()
export class GradesService {
  constructor(@InjectRepository(Grade) private gradeRepository: Repository<Grade>) {}

  async create(dto: CreateGradeDto) {
    const grade: Grade = this.gradeRepository.create({
      date: dto.date,
      matchId: dto.matchId,
      observerId: dto.observerId,
      value: dto.value
    });
    return this.gradeRepository.save(grade);
  }

  async getAll() {
    return this.gradeRepository.find();
  }

  async getById(params: GradeParams) {
    return this.gradeRepository.findOne({ where: { id: params.id } });
  }

  async update(params: GradeParams, dto: UpdateGradeDto) {
    await this.gradeRepository.update(params.id, {
      date: dto.date,
      matchId: dto.matchId,
      observerId: dto.observerId,
      value: dto.value
    });
    return this.getById(params);
  }

  async remove(params: GradeParams) {
    const grade: Grade = await this.getById(params);
    await this.gradeRepository.delete(params.id);
    return grade;
  }

  async getUserGrades(params: UserParams) {
    return this.gradeRepository.find({
      where:
        { observerId: params.id }
    });
  }
}
