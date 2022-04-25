import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { config } from 'dotenv';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { AuthService } from '../auth.service';

config();

export type GoogleUser = { email: string, id: string };

const baseUrl: string = 'https://graderef.bieda.it/';
// const baseUrl: string = 'http://localhost:3000/google/redirect';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {

  constructor(private authService: AuthService) {
    super({
      clientID: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_KEY,
      callbackURL: baseUrl,
      scope: ['email', 'profile'],
    });
  }

  async validate (_accessToken: string, _refreshToken: string, profile: any, _done: VerifyCallback): Promise<GoogleUser> {
    const { emails } = profile;
    const email: string = emails[0].value
    const user: User | undefined = await this.authService.validateUser(email);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: emails[0].value
    }
  }
}