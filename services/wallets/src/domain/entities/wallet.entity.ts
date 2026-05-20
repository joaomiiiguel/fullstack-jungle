import { InsufficientFundsException } from '../exceptions/insufficient-funds.exception';
import { DomainException } from '../exceptions/domain.exception';

export class Wallet {
  public id: string; // The player ID acts as the wallet ID in a 1:1 relationship, but let's keep playerId explicit
  public playerId: string;
  public balance: bigint; // Balance in cents
  public version: number;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(playerId: string, initialBalance: bigint = 0n) {
    if (!playerId || playerId.trim() === '') {
      throw new DomainException('ID do jogador é obrigatório');
    }

    if (initialBalance < 0n) {
      throw new DomainException('O saldo inicial não pode ser negativo');
    }

    this.id = playerId;
    this.playerId = playerId;
    this.balance = initialBalance;
    this.version = 1;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public static create(playerId: string, initialBalance: bigint = 0n): Wallet {
    return new Wallet(playerId, initialBalance);
  }

  public debit(amount: bigint): void {
    if (amount <= 0n) {
      throw new DomainException('O valor do débito deve ser maior que zero');
    }

    if (this.balance < amount) {
      throw new InsufficientFundsException();
    }

    this.balance -= amount;
    this.incrementVersion();
  }

  public credit(amount: bigint): void {
    if (amount <= 0n) {
      throw new DomainException('O valor do crédito deve ser maior que zero');
    }

    this.balance += amount;
    this.incrementVersion();
  }

  private incrementVersion(): void {
    this.version += 1;
    this.updatedAt = new Date();
  }
}
