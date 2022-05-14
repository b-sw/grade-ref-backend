import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { User } from '../../entities/user.entity';
import { Role } from '../types/role';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(protected usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const owners: User[] = await this.usersService.getAllByRole(Role.Owner);

    if (owners.some((owner) => owner.id === request.user.id)) {
      return true;
    } else {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }
}
