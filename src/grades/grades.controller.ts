import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeParams } from './params/GradeParams';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserParams } from '../users/params/UserParams';

@ApiTags('grades')
@Controller('')
@ApiBearerAuth()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('users/:userId/grades')
  @UseGuards(JwtAuthGuard)
  create(@Param() params: UserParams, @Body() dto: CreateGradeDto) {
    return this.gradesService.create(params, dto);
  }

  @Get('grades')
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.gradesService.getAll();
  }

  @Get('users/:userId/grades')
  @UseGuards(JwtAuthGuard)
  getUserGrades(@Param() params: UserParams) {
    return this.gradesService.getUserGrades(params);
  }

  @Get('users/:userId/grades/:gradeId')
  @UseGuards(JwtAuthGuard)
  getById(@Param() params: GradeParams) {
    return this.gradesService.getById(params);
  }

  @Put('users/:userId/grades/:gradeId')
  @UseGuards(JwtAuthGuard)
  update(@Param() params: GradeParams, @Body() dto: UpdateGradeDto) {
    return this.gradesService.update(params, dto);
  }

  @Delete('users/:userId/grades/:gradeId')
  @UseGuards(JwtAuthGuard)
  remove(@Param() params: GradeParams) {
    return this.gradesService.remove(params);
  }
}
