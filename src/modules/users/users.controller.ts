import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaguesService } from 'src/modules/leagues/leagues.service';
import { UsersService } from 'src/modules/users/users.service';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { OwnerGuard } from 'src/shared/guards/owner.guard';
import { MatchesService } from 'src/modules/matches/matches.service';
import { LeagueRoleGuard } from 'src/shared/guards/league-role.guard';
import { Role } from 'src/modules/users/constants/users.constants';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/shared/guards/admin.guard';
import { LeagueParams } from 'src/modules/leagues/params/LeagueParams';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { LeagueUserParams } from 'src/modules/leagues/params/LeagueUserParams';
import { UserParams } from 'src/modules/users/params/UserParams';
import { User } from 'src/entities/user.entity';

@ApiTags('users')
@Controller('')
@ApiBearerAuth()
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly leaguesService: LeaguesService,
        private readonly matchesService: MatchesService,
    ) {}

    @Get('users')
    @UseGuards(JwtAuthGuard, OwnerGuard)
    @ApiOperation({ summary: 'Get all users' })
    async getAll(): Promise<User[]> {
        return this.usersService.getAll();
    }

    @Get('users/admins')
    @UseGuards(JwtAuthGuard, OwnerGuard)
    @ApiOperation({ summary: 'Get all admins' })
    async getAllAdmins(): Promise<User[]> {
        return this.usersService.getAllByRole(Role.Admin);
    }

    @Get('users/referees')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiOperation({ summary: 'Get all referees' })
    async getAllReferees(): Promise<User[]> {
        return this.usersService.getAllByRole(Role.Referee);
    }

    @Get('users/observers')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiOperation({ summary: 'Get all observers' })
    async getAllObservers(): Promise<User[]> {
        return this.usersService.getAllByRole(Role.Observer);
    }

    @Post('users')
    @UseGuards(JwtAuthGuard, OwnerGuard)
    @ApiOperation({ summary: 'Create user' })
    async create(@Body() dto: CreateUserDto): Promise<User> {
        return this.usersService.create(dto);
    }

    @Put('users/:userId')
    @UseGuards(JwtAuthGuard, OwnerGuard)
    @ApiOperation({ summary: 'Update user' })
    async update(@Param() params: UserParams, @Body() dto: UpdateUserDto): Promise<User> {
        return this.usersService.update(params, dto);
    }

    @Delete('users/:userId')
    @UseGuards(JwtAuthGuard, OwnerGuard)
    @ApiOperation({ summary: 'Delete user' })
    async remove(@Param() params: UserParams): Promise<User> {
        return this.usersService.remove(params);
    }

    // todo: adjust guard tests
    @Get('leagues/:leagueId/referees')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
    @ApiOperation({ summary: 'Get referees assigned to a league' })
    async getReferees(@Param() params: LeagueParams): Promise<User[]> {
        return this.leaguesService.getLeagueReferees(params.leagueId);
    }

    // todo: adjust guard tests
    @Get('leagues/:leagueId/observers')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
    @ApiOperation({ summary: 'Get observers assigned to a league' })
    async getObservers(@Param() params: LeagueParams): Promise<User[]> {
        return this.leaguesService.getLeagueObservers(params.leagueId);
    }

    @Get('leagues/:leagueId/admins')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
    @ApiOperation({ summary: 'Get league admins' })
    async getAdmins(@Param() params: LeagueParams): Promise<User[]> {
        return this.leaguesService.getLeagueAdmins(params.leagueId);
    }

    @Post('leagues/:leagueId/referees/:userId')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
    @ApiOperation({ summary: 'Assign referee to a league' })
    async assignReferee(@Param() params: LeagueUserParams): Promise<User> {
        const user: User = await this.usersService.getById(params.userId);
        return this.leaguesService.assignRefereeToLeague(params, user);
    }

    @Post('leagues/:leagueId/observers/:userId')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
    @ApiOperation({ summary: 'Assign observer to a league' })
    async assignObserver(@Param() params: LeagueUserParams): Promise<User> {
        const user: User = await this.usersService.getById(params.userId);
        return this.leaguesService.assignObserverToLeague(params, user);
    }

    @Post('leagues/:leagueId/admins/:userId')
    @UseGuards(JwtAuthGuard, OwnerGuard)
    @ApiOperation({ summary: 'Add user as league admin' })
    async assignAdmin(@Param() params: LeagueUserParams): Promise<User> {
        const user: User = await this.usersService.getById(params.userId);
        return this.leaguesService.assignAdminToLeague(params, user);
    }

    @Delete('leagues/:leagueId/referees/:userId')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
    @ApiOperation({ summary: 'Unassign referee from a league' })
    async unassignReferee(@Param() params: LeagueUserParams): Promise<User> {
        const user: User = await this.usersService.getById(params.userId);
        await this.matchesService.validateUserLeagueRemoval(params);
        return this.leaguesService.removeRefereeFromLeague(params, user);
    }

    @Delete('leagues/:leagueId/observers/:userId')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
    @ApiOperation({ summary: 'Unassign observer from a league' })
    async unassignObserver(@Param() params: LeagueUserParams): Promise<User> {
        const user: User = await this.usersService.getById(params.userId);
        await this.matchesService.validateUserLeagueRemoval(params);
        return this.leaguesService.removeObserverFromLeague(params, user);
    }

    @Delete('leagues/:leagueId/admins/:userId')
    @UseGuards(JwtAuthGuard, LeagueRoleGuard([Role.Admin]))
    @ApiOperation({ summary: 'Unassign league admin' })
    async unassignAdmin(@Param() params: LeagueUserParams): Promise<User> {
        const user: User = await this.usersService.getById(params.userId);
        return this.leaguesService.removeAdminFromLeague(params, user);
    }
}
