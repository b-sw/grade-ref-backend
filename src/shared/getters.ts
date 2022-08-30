import { BadRequestException } from '@nestjs/common';

export function getNotNull<T>(obj: T | undefined): T {
    if (!obj) {
        throw new BadRequestException();
    }
    return obj;
}
