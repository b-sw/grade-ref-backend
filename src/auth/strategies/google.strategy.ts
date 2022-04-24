import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { config } from 'dotenv';

import { Injectable } from '@nestjs/common';

config();

export type GoogleUser = { email: string, id: string };

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {

  constructor() {
    super({
      clientID: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_KEY,
      callbackURL: 'http://localhost:3000/google/redirect',
      scope: ['email', 'profile'],
    });
  }

  async validate (_accessToken: string, _refreshToken: string, profile: any, _done: VerifyCallback): Promise<GoogleUser> {
    const { id, emails } = profile
    return {
      id: id,
      email: emails[0].value
    }
  }
}