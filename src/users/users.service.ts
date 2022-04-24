import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../types/role';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepository: Repository<User>) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async create(email: string, role: Role) {
    const newUser = this.usersRepository.create({ email, role });
    return this.usersRepository.save(newUser);
  }
}
