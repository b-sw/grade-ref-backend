import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeagueParams } from './params/LeagueParams';

@ApiTags('leagues')
@Controller('leagues')
@ApiBearerAuth()
export class LeaguesController {
  constructor(private readonly leaguesService: LeaguesService) {}

  @Post()
  create(@Body() createLeagueDto: CreateLeagueDto) {
    return this.leaguesService.create(createLeagueDto);
  }

  @Get()
  findAll() {
    return this.leaguesService.getAll();
  }

  @Get(':leagueId')
  findOne(@Param() params: LeagueParams) {
    return this.leaguesService.getById(params);
  }

  @Put(':leagueId')
  update(@Param() params: LeagueParams, @Body() updateLeagueDto: UpdateLeagueDto) {
    return this.leaguesService.update(params, updateLeagueDto);
  }

  @Delete(':leagueId')
  remove(@Param() params: LeagueParams) {
    return this.leaguesService.remove(params);
  }
}
