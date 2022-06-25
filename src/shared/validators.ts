import dayjs from 'dayjs';
import { HttpException, HttpStatus } from '@nestjs/common';

export const validateEntryTime = (matchDate: Date, hours: number): void => {
  if (dayjs(matchDate).add(hours, 'hour').isBefore(dayjs())) {
    throw new HttpException(`Time window of ${hours} hours for this entry has passed.`, HttpStatus.BAD_REQUEST);
  }
}