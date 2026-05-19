import { Round } from '../../domain/entities/round.entity';
import { IRoundRepository } from '../../domain/repositories/round-repository.interface';
import { IEventPublisher } from '../ports/event-publisher.interface';

export class CashoutUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  /**
   * Solicita o cash out do jogador na rodada indicada durante a fase RUNNING.
   * Se o multiplicador solicitado for válido e menor do que o ponto de crash,
   * o cash out é efetivado e liquidado, gerando o evento de conclusão.
   */
  public async execute(roundId: string, playerId: string, multiplier: number): Promise<Round> {
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new Error(`Rodada com ID ${roundId} não encontrada`);
    }

    round.requestCashout(playerId, multiplier);

    await this.roundRepository.save(round);
    await this.eventPublisher.publishAll(round.getDomainEvents());
    round.clearDomainEvents();

    return round;
  }
}
