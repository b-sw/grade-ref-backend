import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../../entities/user.entity';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async googleLogin(googleToken: string): Promise<Partial<User> & { accessToken: string }> {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
    });
    const { email } = ticket.getPayload();

    const user: User | undefined = await this.validateUser(email);

    if (!user) {
      throw new NotFoundException();
    }

    const payload = { email: user.email, sub: user.id };

    return {
      id: user.id,
      email: email,
      accessToken: this.jwtService.sign(payload, { expiresIn: '30m' }),
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async devLogin(email: string): Promise<{ accessToken: string }> {
    const user: User | undefined = await this.validateUser(email);

    if (!user) {
      throw new NotFoundException();
    }

    const payload = { email: user.email, sub: user.id };

    return { accessToken: this.jwtService.sign(payload) };
  }

  async validateUser(email: string): Promise<User | undefined> {
    return await this.usersService.getByEmail(email);
  }
}
