import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Role } from 'src/modules/users/constants/users.constants';
import { UsersService } from 'src/modules/users/users.service';
import { User } from 'src/entities/user.entity';

@Injectable()
export class OwnerGuard implements CanActivate {
    constructor(protected usersService: UsersService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const owners: User[] = await this.usersService.getAllByRole(Role.Owner);

        if (owners.some((owner) => owner.id === request.user.id)) {
            return true;
        } else {
            throw new HttpException('Forbidden.', HttpStatus.FORBIDDEN);
        }
    }
}
