import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IEventPublisher } from '../../application/ports/event-publisher.interface';
import { DomainEvent } from '../../domain/events/domain-event.interface';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RabbitMQEventPublisher implements IEventPublisher {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    const pattern = event.constructor.name;
    // Converte propriedades BigInt para string antes de enviar para o broker
    const serializedEvent = JSON.parse(
      JSON.stringify(event, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
    await lastValueFrom(this.client.emit(pattern, serializedEvent));
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
