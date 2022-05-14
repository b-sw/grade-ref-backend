import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../shared/types/role';
import { UserParams } from './params/UserParams';
import { UpdateUserDto } from './dto/update-user.dto';
import { LeagueParams } from '../leagues/params/LeagueParams';
import { LeagueUserParams } from '../leagues/params/LeagueUserParams';
import { LeaguesService } from '../leagues/leagues.service';
import { OwnerGuard } from '../shared/guards/owner.guard';
import { LeagueAdminGuard } from '../shared/guards/league-admin.guard';

@ApiTags('users')
@Controller('')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService,
              private readonly leaguesService: LeaguesService) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  async getAll(): Promise<User[]> {
    return this.usersService.getAll();
  }

  @Get('users/referees')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  async getAllReferees(): Promise<User[]> {
    return this.usersService.getAllByRole(Role.Referee);
  }

  @Get('users/observers')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  async getAllObservers(): Promise<User[]> {
    return this.usersService.getAllByRole(Role.Observer);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  // todo: describe other endpoints
  @ApiOperation({ summary: 'Summary goes here' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Some description'})
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Put('users/:userId')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  async update(@Param() params: UserParams, @Body() dto: UpdateUserDto): Promise<User> {
    return this.usersService.update(params, dto);
  }

  @Delete('users/:userId')
  @UseGuards(JwtAuthGuard, OwnerGuard)
  async remove(@Param() params: UserParams): Promise<User> {
    return this.usersService.remove(params);
  }

  @Get('leagues/:leagueId/referees')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async getReferees(@Param() params: LeagueParams): Promise<User[]> {
    return this.leaguesService.getLeagueReferees(params.leagueId);
  }

  @Get('leagues/:leagueId/observers')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async getObservers(@Param() params: LeagueParams): Promise<User[]> {
    return this.leaguesService.getLeagueObservers(params.leagueId);
  }

  @Get('leagues/:leagueId/admins')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async getAdmins(@Param() params: LeagueParams): Promise<User[]> {
    return this.leaguesService.getLeagueAdmins(params.leagueId);
  }

  @Post('leagues/:leagueId/referees/:userId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async assignReferee(@Param() params: LeagueUserParams): Promise<User[]> {
    const user: User = await this.usersService.getById(params.userId);
    return this.leaguesService.assignRefereeToLeague(params, user);
  }

  @Post('leagues/:leagueId/observers/:userId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async assignObserver(@Param() params: LeagueUserParams): Promise<User[]> {
    const user: User = await this.usersService.getById(params.userId);
    return this.leaguesService.assignObserverToLeague(params, user);
  }

  @Post('leagues/:leagueId/admins/:userId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async assignAdmin(@Param() params: LeagueUserParams): Promise<User[]> {
    const user: User = await this.usersService.getById(params.userId);
    return this.leaguesService.assignAdminToLeague(params, user);
  }

  @Delete('leagues/:leagueId/referees/:userId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async unassignReferee(@Param() params: LeagueUserParams): Promise<User[]> {
    const user: User = await this.usersService.getById(params.userId);
    return this.leaguesService.removeRefereeFromLeague(params, user);
  }

  @Delete('leagues/:leagueId/observers/:userId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async unassignObserver(@Param() params: LeagueUserParams): Promise<User[]> {
    const user: User = await this.usersService.getById(params.userId);
    return this.leaguesService.removeObserverFromLeague(params, user);
  }

  @Delete('leagues/:leagueId/admins/:userId')
  @UseGuards(JwtAuthGuard, LeagueAdminGuard)
  async unassignAdmin(@Param() params: LeagueUserParams): Promise<User[]> {
    const user: User = await this.usersService.getById(params.userId);
    return this.leaguesService.removeAdminFromLeague(params, user);
  }
}
