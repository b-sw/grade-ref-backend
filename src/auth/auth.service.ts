import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GoogleUser } from './strategies/google.strategy';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async login(user: GoogleUser) {
    const payload = { email: user.email, sub: user.id };

    return {
      id: user.id,
      email: user.email,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateUser(email: string): Promise<User | undefined> {
    return await this.usersService.getOneByEmail(email);
  }
}