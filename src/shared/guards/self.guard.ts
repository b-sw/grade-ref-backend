import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { OwnerGuard } from 'src/shared/guards/owner.guard';
import { UserParams } from 'src/modules/users/params/UserParams';

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
