import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '../../shared/constants/uuid.constant';
import { IsUUID } from 'class-validator';

export class UserParams {
  @ApiProperty({ type: String })
  @IsUUID()
  userId: uuid;
}
