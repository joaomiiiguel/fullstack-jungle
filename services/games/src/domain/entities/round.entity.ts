import { RoundStatus } from '../enums/round-status.enum';
import { Bet } from './bet.entity';
import { BetStatus } from '../enums/bet-status.enum';
import { DomainEvent } from '../events/domain-event.interface';
import { RoundCreatedEvent } from '../events/round-created.event';
import { RoundStartedEvent } from '../events/round-started.event';
import { RoundCrashedEvent } from '../events/round-crashed.event';
import { BetPlacedEvent } from '../events/bet-placed.event';
import { BetCashoutRequestedEvent } from '../events/bet-cashout-requested.event';
import { BetCashoutCompletedEvent } from '../events/bet-cashout-completed.event';
import { InvalidRoundStateException } from '../exceptions/invalid-round-state.exception';
import { BetAlreadyPlacedException } from '../exceptions/bet-already-placed.exception';
import { BetNotFoundException } from '../exceptions/bet-not-found.exception';

export class Round {
  public id: string;
  public seed: string;
  public hash: string;
  public crashPoint: number;
  public status: RoundStatus;
  public bets: Bet[];
  public createdAt: Date;
  public startedAt: Date | null;
  public crashedAt: Date | null;
  public finishedAt: Date | null;
  
  // Lista simples para armazenar os eventos de domínio
  public domainEvents: DomainEvent[];

  constructor(
    id: string,
    seed: string,
    hash: string,
    crashPoint: number,
    createdAt: Date = new Date(),
  ) {
    if (crashPoint < 1.0) {
      throw new Error('O ponto de crash deve ser de pelo menos 1.00');
    }
    if (!id || id.trim() === '') {
      throw new Error('ID da rodada é obrigatório');
    }
    if (!seed || seed.trim() === '') {
      throw new Error('A seed é obrigatória');
    }
    if (!hash || hash.trim() === '') {
      throw new Error('O hash é obrigatório');
    }

    this.id = id;
    this.seed = seed;
    this.hash = hash;
    this.crashPoint = crashPoint;
    this.status = RoundStatus.BETTING;
    this.bets = [];
    this.createdAt = createdAt;
    this.startedAt = null;
    this.crashedAt = null;
    this.finishedAt = null;
    this.domainEvents = [];

    // Registra o evento de rodada criada
    this.domainEvents.push(new RoundCreatedEvent(this.id, this.hash, this.createdAt));
  }

  // Método auxiliar para compatibilidade com os testes
  public static create(
    id: string,
    seed: string,
    hash: string,
    crashPoint: number,
    createdAt: Date = new Date(),
  ): Round {
    return new Round(id, seed, hash, crashPoint, createdAt);
  }

  // Reconstrói a entidade a partir do estado do banco de dados (TypeORM)
  public static reconstitute(
    id: string,
    seed: string,
    hash: string,
    crashPoint: number,
    status: RoundStatus,
    createdAt: Date,
    startedAt: Date | null,
    crashedAt: Date | null,
    finishedAt: Date | null,
    bets: Bet[] = [],
  ): Round {
    const round = new Round(id, seed, hash, crashPoint, createdAt);
    round.status = status;
    round.startedAt = startedAt;
    round.crashedAt = crashedAt;
    round.finishedAt = finishedAt;
    round.bets = bets;
    round.domainEvents = []; // Limpa eventos históricos
    return round;
  }

  public getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }

  public clearDomainEvents(): void {
    this.domainEvents = [];
  }

  public start(startedAt: Date = new Date()): void {
    if (this.status !== RoundStatus.BETTING) {
      throw new InvalidRoundStateException(
        `Não é possível iniciar a rodada com status ${this.status}. A rodada precisa estar no status BETTING.`,
      );
    }
    this.status = RoundStatus.RUNNING;
    this.startedAt = startedAt;
    this.domainEvents.push(new RoundStartedEvent(this.id, this.startedAt));
  }

  public placeBet(playerId: string, amount: bigint, placedAt: Date = new Date()): void {
    if (this.status !== RoundStatus.BETTING) {
      throw new InvalidRoundStateException(
        `Não é possível apostar no status ${this.status}. Apostas só podem ser feitas no status BETTING.`,
      );
    }

    // Verifica se o jogador já realizou aposta usando o método 'some' nativo
    const alreadyBet = this.bets.some(bet => bet.playerId === playerId);
    if (alreadyBet) {
      throw new BetAlreadyPlacedException(playerId, this.id);
    }

    const bet = new Bet(playerId, amount);
    this.bets.push(bet);

    this.domainEvents.push(new BetPlacedEvent(this.id, playerId, amount, placedAt));
  }

  public requestCashout(playerId: string, multiplier: number, requestedAt: Date = new Date()): void {
    if (this.status !== RoundStatus.RUNNING) {
      throw new InvalidRoundStateException(
        `Não é possível fazer cashout no status ${this.status}. Cashouts só podem ocorrer no status RUNNING.`,
      );
    }

    // Busca a aposta do jogador usando 'find' nativo
    const bet = this.bets.find(b => b.playerId === playerId);
    if (!bet) {
      throw new BetNotFoundException(playerId, this.id);
    }

    // Registra a solicitação de cashout
    this.domainEvents.push(new BetCashoutRequestedEvent(this.id, playerId, multiplier, requestedAt));

    // Se o multiplicador solicitado for menor do que o ponto de crash da rodada, o cashout é bem-sucedido
    if (multiplier < this.crashPoint) {
      bet.cashout(multiplier, requestedAt);
      this.domainEvents.push(
        new BetCashoutCompletedEvent(
          this.id,
          playerId,
          bet.amount,
          multiplier,
          bet.payout!,
          requestedAt,
        ),
      );
    }
  }

  public crash(crashedAt: Date = new Date()): void {
    if (this.status !== RoundStatus.RUNNING) {
      throw new InvalidRoundStateException(
        `Não é possível dar crash na rodada com status ${this.status}. A rodada precisa estar no status RUNNING.`,
      );
    }
    this.status = RoundStatus.CRASHED;
    this.crashedAt = crashedAt;

    // Todas as apostas ainda pendentes quando a rodada crasha são consideradas perdidas
    for (const bet of this.bets) {
      if (bet.status === BetStatus.PENDING) {
        bet.lose();
      }
    }

    this.domainEvents.push(new RoundCrashedEvent(this.id, this.crashPoint, this.crashedAt));
  }

  public finish(finishedAt: Date = new Date()): void {
    if (this.status !== RoundStatus.CRASHED) {
      throw new InvalidRoundStateException(
        `Não é possível finalizar a rodada com status ${this.status}. A rodada precisa estar no status CRASHED.`,
      );
    }
    this.status = RoundStatus.FINISHED;
    this.finishedAt = finishedAt;
  }
}
