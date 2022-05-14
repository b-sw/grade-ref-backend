import { Request, Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeagueParams } from './params/LeagueParams';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { League } from '../entities/league.entity';
import { OwnerGuard } from '../shared/guards/owner.guard';
import { AdminGuard } from '../shared/guards/admin.guard';
import { LeagueAdminGuard } from '../shared/guards/league-admin.guard';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';

@ApiTags('leagues')
@Controller('leagues')
@ApiBearerAuth()
export class LeaguesController {
  constructor(private readonly leaguesService: LeaguesService,
              private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Request() req, @Body() createLeagueDto: CreateLeagueDto): Promise<League> {
    // todo: delete later
    console.log('request user is', req.user);
    const initialLeagueAdmin: User = await this.usersService.getById(req.user.id);
    return this.leaguesService.createLeague(initialLeagueAdmin, createLeagueDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  async getAll(): Promise<League[]> {
    return this.leaguesService.getLeagues();
  }

  @Get(':leagueId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async findOne(@Param() params: LeagueParams): Promise<League> {
    return this.leaguesService.getLeagueById(params.leagueId);
  }

  @Put(':leagueId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async update(@Param() params: LeagueParams, @Body() updateLeagueDto: UpdateLeagueDto): Promise<League> {
    return this.leaguesService.updateLeague(params, updateLeagueDto);
  }

  @Delete(':leagueId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async remove(@Param() params: LeagueParams): Promise<League> {
    return this.leaguesService.removeLeague(params);
  }
}
