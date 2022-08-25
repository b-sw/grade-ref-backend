import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from 'src/modules/users/constants/users.constants';
import { UsersService } from 'src/modules/users/users.service';
import { OwnerGuard } from 'src/shared/guards/owner.guard';
import { User } from 'src/entities/user.entity';

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
