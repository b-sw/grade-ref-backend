import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../types/role';

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
}
