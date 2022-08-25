import { ApiProperty } from '@nestjs/swagger';

export class AuthBody {
  @ApiProperty({ type: String })
  googleToken: string;
}

export class AuthBodyDev {
  @ApiProperty()
  email: string;

  @ApiProperty()
  devPassword: string;
}
