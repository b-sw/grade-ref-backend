import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const JWT_GUARD_TYPE = 'jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_GUARD_TYPE) {}
