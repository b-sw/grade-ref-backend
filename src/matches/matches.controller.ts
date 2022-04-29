import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchParams } from './params/MatchParams';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserParams } from '../users/params/UserParams';

@ApiTags('matches')
@Controller('')
@ApiBearerAuth()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('matches')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateMatchDto) {
    return this.matchesService.create(dto);
  }

  @Get('matches')
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.matchesService.getAll();
  }

  @Get('matches/:id')
  @UseGuards(JwtAuthGuard)
  getById(@Param() params: MatchParams) {
    return this.matchesService.getById(params);
  }

  @Put('matches/:id')
  @UseGuards(JwtAuthGuard)
  update(@Param() params: MatchParams, @Body() dto: UpdateMatchDto) {
    return this.matchesService.update(params, dto);
  }

  @Delete('matches/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param() params: MatchParams) {
    return this.matchesService.remove(params);
  }

  @Get('users/:id/matches')
  @UseGuards(JwtAuthGuard)
  getAssignedMatches(@Param() params: UserParams) {
    return this.matchesService.getUserMatches(params);
  }
}
