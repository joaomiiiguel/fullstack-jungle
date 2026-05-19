import { describe, expect, test, beforeEach } from 'bun:test';
import { Round } from '../../src/domain/entities/round.entity';
import { RoundStatus } from '../../src/domain/enums/round-status.enum';
import { BetStatus } from '../../src/domain/enums/bet-status.enum';
import { IRoundRepository } from '../../src/domain/repositories/round-repository.interface';
import { IEventPublisher } from '../../src/application/ports/event-publisher.interface';
import { DomainEvent } from '../../src/domain/events/domain-event.interface';
import { ProvablyFairService } from '../../src/domain/services/provably-fair.service';
import { CreateRoundUseCase } from '../../src/application/use-cases/create-round.use-case';
import { StartRoundUseCase } from '../../src/application/use-cases/start-round.use-case';
import { PlaceBetUseCase } from '../../src/application/use-cases/place-bet.use-case';
import { CashoutUseCase } from '../../src/application/use-cases/cashout.use-case';
import { EndRoundUseCase } from '../../src/application/use-cases/end-round.use-case';
import { RoundCreatedEvent } from '../../src/domain/events/round-created.event';
import { RoundStartedEvent } from '../../src/domain/events/round-started.event';
import { BetPlacedEvent } from '../../src/domain/events/bet-placed.event';
import { BetCashoutCompletedEvent } from '../../src/domain/events/bet-cashout-completed.event';
import { RoundCrashedEvent } from '../../src/domain/events/round-crashed.event';

// Implementações em memória para fins de teste
class InMemoryRoundRepository implements IRoundRepository {
  public rounds = new Map<string, Round>();

  public async save(round: Round): Promise<void> {
    this.rounds.set(round.id, round);
  }

  public async findById(id: string): Promise<Round | null> {
    return this.rounds.get(id) || null;
  }

  public async findCurrent(): Promise<Round | null> {
    return Array.from(this.rounds.values()).find(r => r.status !== RoundStatus.FINISHED) || null;
  }
}

class MockEventPublisher implements IEventPublisher {
  public publishedEvents: DomainEvent[] = [];

  public async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
  }

  public async publishAll(events: DomainEvent[]): Promise<void> {
    this.publishedEvents.push(...events);
  }
}

describe('Use Cases do Ciclo de Vida da Rodada', () => {
  let roundRepository: InMemoryRoundRepository;
  let eventPublisher: MockEventPublisher;
  let provablyFairService: ProvablyFairService;

  beforeEach(() => {
    roundRepository = new InMemoryRoundRepository();
    eventPublisher = new MockEventPublisher();
    provablyFairService = new ProvablyFairService();
  });

  describe('CreateRoundUseCase', () => {
    test('deve criar uma rodada com sucesso no status BETTING e disparar RoundCreatedEvent', async () => {
      const useCase = new CreateRoundUseCase(roundRepository, eventPublisher, provablyFairService);
      const roundId = 'round-1';

      const round = await useCase.execute(roundId);

      expect(round.id).toBe(roundId);
      expect(round.status).toBe(RoundStatus.BETTING);
      expect(round.seed).not.toBeEmpty();
      expect(round.hash).not.toBeEmpty();
      expect(round.crashPoint).toBeGreaterThanOrEqual(1.00);

      // Verifica se a rodada foi salva
      const savedRound = await roundRepository.findById(roundId);
      expect(savedRound).not.toBeNull();

      // Verifica o evento disparado
      expect(eventPublisher.publishedEvents).toHaveLength(1);
      expect(eventPublisher.publishedEvents[0]).toBeInstanceOf(RoundCreatedEvent);
    });
  });

  describe('StartRoundUseCase', () => {
    test('deve iniciar uma rodada de BETTING para RUNNING com sucesso e disparar RoundStartedEvent', async () => {
      // Setup
      const round = Round.create('round-1', 'secret-seed', 'hash-value', 2.50);
      round.clearDomainEvents(); // Limpa eventos de criação do setup
      await roundRepository.save(round);

      const useCase = new StartRoundUseCase(roundRepository, eventPublisher);
      const updatedRound = await useCase.execute('round-1');

      expect(updatedRound.status).toBe(RoundStatus.RUNNING);
      expect(updatedRound.startedAt).toBeInstanceOf(Date);

      // Verifica eventos
      expect(eventPublisher.publishedEvents).toHaveLength(1);
      expect(eventPublisher.publishedEvents[0]).toBeInstanceOf(RoundStartedEvent);
    });
  });

  describe('PlaceBetUseCase', () => {
    test('deve registrar uma aposta com sucesso e publicar BetPlacedEvent', async () => {
      // Setup
      const round = Round.create('round-1', 'secret-seed', 'hash-value', 2.50);
      round.clearDomainEvents(); // Limpa eventos do setup
      await roundRepository.save(round);

      const useCase = new PlaceBetUseCase(roundRepository, eventPublisher);
      const updatedRound = await useCase.execute('round-1', 'player-abc', 5000n); // R$ 50,00

      expect(updatedRound.bets).toHaveLength(1);
      expect(updatedRound.bets[0].playerId).toBe('player-abc');
      expect(updatedRound.bets[0].amount).toBe(5000n);
      expect(updatedRound.bets[0].status).toBe(BetStatus.PENDING);

      // Verifica eventos
      expect(eventPublisher.publishedEvents).toHaveLength(1);
      expect(eventPublisher.publishedEvents[0]).toBeInstanceOf(BetPlacedEvent);
    });
  });

  describe('CashoutUseCase', () => {
    test('deve realizar cashout com sucesso e disparar BetCashoutCompletedEvent se o multiplicador for abaixo do crashPoint', async () => {
      // Setup
      const round = Round.create('round-1', 'secret-seed', 'hash-value', 2.50);
      round.placeBet('player-abc', 1000n); // R$ 10,00
      round.start();
      round.clearDomainEvents(); // Limpa todos os eventos acumulados no setup
      await roundRepository.save(round);

      const useCase = new CashoutUseCase(roundRepository, eventPublisher);
      const updatedRound = await useCase.execute('round-1', 'player-abc', 1.50);

      const bet = updatedRound.bets[0];
      expect(bet.status).toBe(BetStatus.WON);
      expect(bet.multiplier).toBe(1.50);
      expect(bet.payout).toBe(1500n); // R$ 15,00

      // Esperamos os eventos gerados pela ação de cashout (solicitação e conclusão)
      expect(eventPublisher.publishedEvents).toHaveLength(2);
      expect(eventPublisher.publishedEvents[1]).toBeInstanceOf(BetCashoutCompletedEvent);
    });
  });

  describe('EndRoundUseCase', () => {
    test('deve crashar a rodada, liquidar apostas pendentes como LOST, passar para FINISHED e publicar eventos', async () => {
      // Setup
      const round = Round.create('round-1', 'secret-seed', 'hash-value', 2.50);
      round.placeBet('player-win', 1000n);
      round.placeBet('player-lose', 2000n);
      round.start();
      
      // player-win saca antes do crash
      round.requestCashout('player-win', 2.00);
      round.clearDomainEvents(); // Limpa todos os eventos acumulados do setup
      await roundRepository.save(round);

      // Execução
      const useCase = new EndRoundUseCase(roundRepository, eventPublisher);
      const updatedRound = await useCase.execute('round-1');

      expect(updatedRound.status).toBe(RoundStatus.FINISHED);
      expect(updatedRound.crashedAt).toBeInstanceOf(Date);
      expect(updatedRound.finishedAt).toBeInstanceOf(Date);

      // Verifica status final das apostas
      const winBet = updatedRound.bets.find(b => b.playerId === 'player-win')!;
      const loseBet = updatedRound.bets.find(b => b.playerId === 'player-lose')!;
      
      expect(winBet.status).toBe(BetStatus.WON);
      expect(loseBet.status).toBe(BetStatus.LOST);
      expect(loseBet.payout).toBe(0n);

      // Verifica eventos disparados pelo crash (RoundCrashedEvent)
      expect(eventPublisher.publishedEvents).toHaveLength(1);
      expect(eventPublisher.publishedEvents[0]).toBeInstanceOf(RoundCrashedEvent);
    });
  });
});
