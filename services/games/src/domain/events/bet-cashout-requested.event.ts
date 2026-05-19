import { DomainEvent } from './domain-event.interface';

export class BetCashoutRequestedEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    public readonly roundId: string,
    public readonly playerId: string,
    public readonly multiplier: number,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
