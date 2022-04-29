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

  @Post('grades')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateGradeDto) {
    return this.gradesService.create(dto);
  }

  @Get('grades')
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.gradesService.getAll();
  }

  @Get('grades/:id')
  @UseGuards(JwtAuthGuard)
  getById(@Param() params: GradeParams) {
    return this.gradesService.getById(params);
  }

  @Put('grades/:id')
  @UseGuards(JwtAuthGuard)
  update(@Param() params: GradeParams, @Body() dto: UpdateGradeDto) {
    return this.gradesService.update(params, dto);
  }

  @Delete('grades/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param() params: GradeParams) {
    return this.gradesService.remove(params);
  }

  @Get('users/:id/grades')
  @UseGuards(JwtAuthGuard)
  getUserGrades(@Param() params: UserParams) {
    return this.gradesService.getUserGrades(params);
  }
}
