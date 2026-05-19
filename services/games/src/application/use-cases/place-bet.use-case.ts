import { Round } from '../../domain/entities/round.entity';
import { IRoundRepository } from '../../domain/repositories/round-repository.interface';
import { IEventPublisher } from '../ports/event-publisher.interface';

export class PlaceBetUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  /**
   * Realiza uma aposta na rodada indicada se a mesma estiver ativa e
   * no status de BETTING. Registra a aposta e publica o evento.
   */
  public async execute(roundId: string, playerId: string, amount: bigint): Promise<Round> {
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new Error(`Rodada com ID ${roundId} não encontrada`);
    }

    round.placeBet(playerId, amount);

    await this.roundRepository.save(round);
    await this.eventPublisher.publishAll(round.getDomainEvents());
    round.clearDomainEvents();

    return round;
  }
}
