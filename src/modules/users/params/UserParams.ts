import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { uuid } from 'src/shared/types/uuid.type';

export class UserParams {
    @ApiProperty({ type: String })
    @IsUUID()
    userId: uuid;
}
