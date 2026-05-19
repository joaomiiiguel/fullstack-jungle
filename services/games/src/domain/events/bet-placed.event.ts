import { DomainEvent } from './domain-event.interface';

export class BetPlacedEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    public readonly roundId: string,
    public readonly playerId: string,
    public readonly amount: bigint,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
