import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TeamParams } from './params/TeamParams';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('teams')
@Controller('teams')
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.teamsService.getAll();
  }

  @Get(':teamId')
  @UseGuards(JwtAuthGuard)
  findOne(@Param() params: TeamParams) {
    return this.teamsService.getById(params);
  }

  @Put(':teamId')
  @UseGuards(JwtAuthGuard)
  update(@Param() params: TeamParams, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(params, dto);
  }

  @Delete(':teamId')
  @UseGuards(JwtAuthGuard)
  remove(@Param() params: TeamParams) {
    return this.teamsService.remove(params);
  }
}
