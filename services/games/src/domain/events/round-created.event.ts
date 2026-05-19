import { DomainEvent } from './domain-event.interface';

export class RoundCreatedEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    public readonly roundId: string,
    public readonly hash: string,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
