import { Round } from '../../domain/entities/round.entity';
import { IRoundRepository } from '../../domain/repositories/round-repository.interface';
import { IEventPublisher } from '../ports/event-publisher.interface';
import { ProvablyFairService } from '../../domain/services/provably-fair.service';
import * as crypto from 'node:crypto';

export class CreateRoundUseCase {
  constructor(
    private readonly roundRepository: IRoundRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly provablyFairService: ProvablyFairService,
  ) {}

  /**
   * Cria uma nova rodada no estado BETTING (Fase de Apostas), gerando os dados de
   * Provably Fair de forma segura e registrando o evento de criação.
   */
  public async execute(id: string, clientSeed?: string): Promise<Round> {
    const seed = this.provablyFairService.generateServerSeed();
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const finalClientSeed = clientSeed || '0000000000000000000000000000000000000000000000000000000000000000';
    const crashPoint = this.provablyFairService.calculateCrashPoint(seed, finalClientSeed);

    const round = Round.create(id, seed, hash, crashPoint);

    await this.roundRepository.save(round);
    await this.eventPublisher.publishAll(round.getDomainEvents());
    round.clearDomainEvents();

    return round;
  }
}
