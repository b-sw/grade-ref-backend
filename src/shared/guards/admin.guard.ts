import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { User } from '../../entities/user.entity';
import { Role } from '../types/role';
import { OwnerGuard } from './owner.guard';

@Injectable()
export class AdminGuard extends OwnerGuard implements CanActivate {
  constructor(protected usersService: UsersService) {
    super(usersService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const admins: User[] = await this.usersService.getAllByRole(Role.Admin);

    if (admins.some((admin) => admin.id === request.user.id)) {
      return true;
    }
    return await super.canActivate(context);
  }
}
