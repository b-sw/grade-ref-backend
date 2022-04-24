import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GoogleUser } from './strategies/google.strategy';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(user: GoogleUser) {
    const payload = { email: user.email, sub: user.id };

    return {
      id: user.id,
      email: user.email,
      accessToken: this.jwtService.sign(payload),
    };
  }
}