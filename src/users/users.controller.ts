import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../types/role';
import { UserParams } from './params/UserParams';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getAll(): Promise<User[]> {
    return this.usersService.getAll();
  }

  @Get('/referees')
  @UseGuards(JwtAuthGuard)
  getAllReferees(): Promise<User[]> {
    return this.usersService.getAllByRole(Role.Referee);
  }

  @Get('/observers')
  @UseGuards(JwtAuthGuard)
  getAllObservers(): Promise<User[]> {
    return this.usersService.getAllByRole(Role.Observer);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Put(':userId')
  @UseGuards(JwtAuthGuard)
  update(@Param() params: UserParams, @Body() dto: UpdateUserDto) {
    return this.usersService.update(params, dto);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  remove(@Param() params: UserParams) {
    return this.usersService.remove(params);
  }
}
