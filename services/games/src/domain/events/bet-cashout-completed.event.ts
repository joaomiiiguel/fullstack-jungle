import { DomainEvent } from './domain-event.interface';

export class BetCashoutCompletedEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    public readonly roundId: string,
    public readonly playerId: string,
    public readonly amount: bigint,
    public readonly multiplier: number,
    public readonly payout: bigint,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
