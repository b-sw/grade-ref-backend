import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaguesService } from 'src/modules/leagues/leagues.service';
import { League } from 'src/entities/league.entity';
import { UsersService } from 'src/modules/users/users.service';
import { OwnerGuard } from 'src/shared/guards/owner.guard';
import { UpdateLeagueDto } from 'src/modules/leagues/dto/update-league.dto';
import { CreateLeagueDto } from 'src/modules/leagues/dto/create-league.dto';
import { getNotNull } from 'src/shared/getters';
import { LeagueRoleGuard } from 'src/shared/guards/league-role.guard';
import { SelfGuard } from 'src/shared/guards/self.guard';
import { Role } from 'src/modules/users/constants/users.constants';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/shared/guards/admin.guard';
import { LeagueParams } from 'src/modules/leagues/params/LeagueParams';
import { UserParams } from 'src/modules/users/params/UserParams';

@ApiTags('leagues')
@Controller('')
@ApiBearerAuth()
export class LeaguesController {
  constructor(private readonly leaguesService: LeaguesService, private readonly usersService: UsersService) {}

  @Post('leagues')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create league' })
  async create(@Request() req, @Body() createLeagueDto: CreateLeagueDto): Promise<League> {
    const initialLeagueAdmin = await this.usersService.getById(req.user.id);
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
    const user = getNotNull(await this.usersService.getById(params.userId));
    return this.leaguesService.getLeaguesByUser(user);
  }

  @Get('leagues/:leagueId')
  @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
  @ApiOperation({ summary: 'Get league' })
  async findOne(@Param() params: LeagueParams): Promise<League> {
    return this.leaguesService.getLeagueById(params.leagueId);
  }

  @Put('leagues/:leagueId')
  @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
  @ApiOperation({ summary: 'Update league' })
  async update(@Param() params: LeagueParams, @Body() updateLeagueDto: UpdateLeagueDto): Promise<League> {
    return this.leaguesService.updateLeague(params, updateLeagueDto);
  }

  @Delete('leagues/:leagueId')
  @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
  @ApiOperation({ summary: 'Delete league' })
  async remove(@Param() params: LeagueParams): Promise<League> {
    return this.leaguesService.removeLeague(params);
  }
}
