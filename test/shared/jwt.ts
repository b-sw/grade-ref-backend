import * as jwt from 'jsonwebtoken';
import { User } from 'src/entities/user.entity';

export const getSignedJwt = (user: User) => jwt.sign({ email: user.email, sub: user.id }, process.env.JWT_SECRET);
