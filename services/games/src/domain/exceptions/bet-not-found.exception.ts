import { DomainException } from './domain.exception';

export class BetNotFoundException extends DomainException {
  constructor(playerId: string, roundId: string) {
    super(`Bet not found for player ${playerId} on round ${roundId}`);
  }
}
