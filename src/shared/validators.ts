import dayjs from 'dayjs';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MATCH_DURATION } from '../domains/matches/matches.service';

export const validateEntryTime = (matchDate: Date, hours: number): void => {
  if (dayjs(matchDate).add(hours, 'hour').isBefore(dayjs())) {
    throw new HttpException(
      `Time window of ${hours - MATCH_DURATION} hours for this entry has passed.`,
      HttpStatus.BAD_REQUEST,
    );
  }
};
