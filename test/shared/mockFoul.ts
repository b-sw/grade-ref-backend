import { CreateFoulDto } from 'src/modules/fouls/dto/create-foul.dto';
import { Card } from 'src/entities/foul.entity';
import { uuid } from 'src/shared/types/uuid.type';

export const MockCreateFoulDto = (
    teamId: uuid,
    minute?: number,
    card?: Card,
    playerNumber?: number,
    description?: string,
    valid?: boolean,
): CreateFoulDto => {
    return {
        minute: minute ?? 0,
        card: card ?? Card.Red,
        playerNumber: playerNumber ?? 1,
        description: description ?? 'Mock foul',
        valid: valid ?? true,
        teamId: teamId,
    };
};
