import { Round } from '../../domain/entities/round.entity';
import { IRoundRepository } from '../../domain/repositories/round-repository.interface';
import { IEventPublisher } from '../ports/event-publisher.interface';

export class EndRoundUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  /**
   * Encerra a rodada ativando o crash da rodada e finalizando seu estado.
   * Modifica o status para CRASHED e depois para FINISHED, marcando as apostas pendentes como perdidas.
   */
  public async execute(roundId: string): Promise<Round> {
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new Error(`Rodada com ID ${roundId} não encontrada`);
    }

    round.crash();
    round.finish();

    await this.roundRepository.save(round);
    await this.eventPublisher.publishAll(round.getDomainEvents());
    round.clearDomainEvents();

    return round;
  }
}
