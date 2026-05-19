import { BetStatus } from '../enums/bet-status.enum';
import { InvalidBetAmountException } from '../exceptions/invalid-bet-amount.exception';

export class Bet {
  public playerId: string;
  public amount: bigint;
  public status: BetStatus;
  public multiplier: number | null;
  public payout: bigint | null;
  public placedAt: Date;
  public cashedAt: Date | null;

  constructor(playerId: string, amount: bigint) {
    const MIN_AMOUNT = 100n; // R$1.00 em centavos
    const MAX_AMOUNT = 100000n; // R$1000.00 em centavos

    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      throw new InvalidBetAmountException(
        `O valor da aposta deve ser entre 1.00 e 1000.00 (em centavos: de ${MIN_AMOUNT} a ${MAX_AMOUNT}). Recebido: ${amount}`,
      );
    }

    if (!playerId || playerId.trim() === '') {
      throw new Error('ID do jogador é obrigatório');
    }

    this.playerId = playerId;
    this.amount = amount;
    this.status = BetStatus.PENDING;
    this.multiplier = null;
    this.payout = null;
    this.placedAt = new Date();
    this.cashedAt = null;
  }

  // Método auxiliar para compatibilidade com os testes
  public static create(playerId: string, amount: bigint): Bet {
    return new Bet(playerId, amount);
  }

  public cashout(multiplier: number, cashedAt: Date = new Date()): void {
    if (this.status !== BetStatus.PENDING) {
      throw new Error('Aposta já finalizada');
    }
    if (multiplier < 1.0) {
      throw new Error('O multiplicador deve ser de pelo menos 1.00');
    }

    this.status = BetStatus.WON;
    this.multiplier = multiplier;
    this.cashedAt = cashedAt;

    // Calcula o retorno (payout) em centavos usando precisão de bigint
    const multiplierCents = BigInt(Math.floor(multiplier * 100));
    this.payout = (this.amount * multiplierCents) / 100n;
  }

  public lose(): void {
    if (this.status !== BetStatus.PENDING) {
      throw new Error('Aposta já finalizada');
    }
    this.status = BetStatus.LOST;
    this.payout = 0n;
  }
}
