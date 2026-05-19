import { DomainEvent } from './domain-event.interface';

export class RoundCrashedEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    public readonly roundId: string,
    public readonly crashPoint: number,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
