import { Request, Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeagueParams } from './params/LeagueParams';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { League } from '../entities/league.entity';
import { OwnerGuard } from '../shared/guards/owner.guard';
import { AdminGuard } from '../shared/guards/admin.guard';
import { LeagueAdminGuard } from '../shared/guards/league-admin.guard';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';
import { UserParams } from '../users/params/UserParams';
import { SelfGuard } from '../shared/guards/self.guard';

@ApiTags('leagues')
@Controller('')
@ApiBearerAuth()
export class LeaguesController {
  constructor(private readonly leaguesService: LeaguesService,
              private readonly usersService: UsersService) {}

  @Post('leagues')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create league' })
  async create(@Request() req, @Body() createLeagueDto: CreateLeagueDto): Promise<League> {
    const initialLeagueAdmin: User = await this.usersService.getById(req.user.id);
    return this.leaguesService.createLeague(initialLeagueAdmin, createLeagueDto);
  }

  @Get('leagues')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({ summary: 'Get all leagues' })
  async getAll(): Promise<League[]> {
    return this.leaguesService.getLeagues();
  }

  @Get('users/:userId/leagues')
  @UseGuards(JwtAuthGuard, SelfGuard)
  @ApiOperation({ summary: 'Get leagues by user' })
  async getLeaguesByUser(@Param() params: UserParams): Promise<League[]> {
    const user: User = await this.usersService.getById(params.userId);
    return this.leaguesService.getLeaguesByUser(user);
  }

  @Get('leagues/:leagueId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  @ApiOperation({ summary: 'Get league' })
  async findOne(@Param() params: LeagueParams): Promise<League> {
    return this.leaguesService.getLeagueById(params.leagueId);
  }

  @Put('leagues/:leagueId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  @ApiOperation({ summary: 'Update league' })
  async update(@Param() params: LeagueParams, @Body() updateLeagueDto: UpdateLeagueDto): Promise<League> {
    return this.leaguesService.updateLeague(params, updateLeagueDto);
  }

  @Delete('leagues/:leagueId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  @ApiOperation({ summary: 'Delete league' })
  async remove(@Param() params: LeagueParams): Promise<League> {
    return this.leaguesService.removeLeague(params);
  }
}
