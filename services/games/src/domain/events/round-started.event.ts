import { DomainEvent } from './domain-event.interface';

export class RoundStartedEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    public readonly roundId: string,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
