import { DomainEvent } from '../../domain/events/domain-event.interface';

export interface IEventPublisher {
  /**
   * Publica um único evento de domínio.
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publica uma lista de eventos de domínio.
   */
  publishAll(events: DomainEvent[]): Promise<void>;
}
