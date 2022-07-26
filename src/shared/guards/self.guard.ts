import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { UserParams } from '../../users/params/UserParams';
import { OwnerGuard } from './owner.guard';

@Injectable()
export class SelfGuard extends OwnerGuard implements CanActivate {
  constructor(protected usersService: UsersService) {
    super(usersService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params: UserParams = request.params;

    if (params.userId === request.user.id) {
      return true;
    }
    return super.canActivate(context);
  }
}
