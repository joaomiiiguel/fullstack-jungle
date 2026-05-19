import { DomainException } from './domain.exception';

export class BetAlreadyPlacedException extends DomainException {
  constructor(playerId: string, roundId: string) {
    super(`Player ${playerId} has already placed a bet on round ${roundId}`);
  }
}
