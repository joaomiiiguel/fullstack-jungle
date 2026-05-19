import { Round } from '../../domain/entities/round.entity';
import { IRoundRepository } from '../../domain/repositories/round-repository.interface';
import { IEventPublisher } from '../ports/event-publisher.interface';

export class StartRoundUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  /**
   * Inicia a rodada, mudando o status de BETTING para RUNNING.
   * Dispara o evento de rodada iniciada para que os clientes comecem
   * a receber as atualizações do multiplicador.
   */
  public async execute(roundId: string): Promise<Round> {
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new Error(`Rodada com ID ${roundId} não encontrada`);
    }

    round.start();

    await this.roundRepository.save(round);
    await this.eventPublisher.publishAll(round.getDomainEvents());
    round.clearDomainEvents();

    return round;
  }
}
