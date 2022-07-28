import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { uuid } from '../../shared/constants/uuid.constant';
import { UserParams } from './params/UserParams';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from './constants/users.constants';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepository: Repository<User>) {}

  async getAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async getAllByRole(role: Role): Promise<User[]> {
    return this.usersRepository.find({ where: { role: role } });
  }

  async getByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email: email } });
  }

  async getByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { phoneNumber: phoneNumber } });
  }

  async getById(id: uuid): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id: id } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    await this.validateUnique(dto);
    const newUser = this.usersRepository.create({
      email: dto.email,
      role: dto.role,
      phoneNumber: dto.phoneNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    return this.usersRepository.save(newUser);
  }

  async update(params: UserParams, dto: UpdateUserDto): Promise<User> {
    await this.validateUnique(dto, params.userId);
    await this.usersRepository.update(params.userId, {
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    return this.getById(params.userId);
  }

  async remove(params: UserParams): Promise<User> {
    const user: User = await this.getById(params.userId);
    await this.usersRepository.delete(params.userId);
    return user;
  }

  async validateUnique(dto: CreateUserDto | UpdateUserDto, id?: uuid): Promise<void> {
    const existingLeague: User | undefined = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (!existingLeague) {
      return;
    }

    if (!id || id !== existingLeague.id) {
      throw new HttpException(`Email '` + dto.email + `' is not unique`, HttpStatus.BAD_REQUEST);
    }
  }
}
