import { uuid } from 'aws-sdk/clients/customerprofiles';
import { Card } from '../../src/entities/foul.entity';
import { CreateFoulDto } from '../../src/fouls/dto/create-foul.dto';

export const MockCreateFoulDto = (teamId: uuid,
                                  minute?: number,
                                  card?: Card,
                                  playerNumber?: number,
                                  description?: string,
                                  valid?: boolean): CreateFoulDto => {
  return {
    minute: minute ?? 0,
    card: card ?? Card.Red,
    playerNumber: playerNumber ?? 1,
    description: description ?? 'Mock foul',
    valid: valid ?? true,
    teamId: teamId,
  };
}