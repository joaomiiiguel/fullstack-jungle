/// <reference types="bun-types" />
import { describe, expect, it } from 'bun:test';
import { Wallet } from '../../../src/domain/entities/wallet.entity';
import { InsufficientFundsException } from '../../../src/domain/exceptions/insufficient-funds.exception';
import { DomainException } from '../../../src/domain/exceptions/domain.exception';

describe('Wallet Entity', () => {
  it('should create a wallet with a valid player ID and zero initial balance', () => {
    const wallet = Wallet.create('player-1');
    expect(wallet.playerId).toBe('player-1');
    expect(wallet.id).toBe('player-1');
    expect(wallet.balance).toBe(0n);
    expect(wallet.version).toBe(1);
  });

  it('should not allow creating a wallet with negative balance', () => {
    expect(() => Wallet.create('player-1', -100n)).toThrow(DomainException);
  });

  it('should credit a positive amount successfully', () => {
    const wallet = Wallet.create('player-1', 1000n);
    wallet.credit(500n);
    expect(wallet.balance).toBe(1500n);
    expect(wallet.version).toBe(2);
  });

  it('should not allow crediting a negative or zero amount', () => {
    const wallet = Wallet.create('player-1', 1000n);
    expect(() => wallet.credit(0n)).toThrow(DomainException);
    expect(() => wallet.credit(-10n)).toThrow(DomainException);
  });

  it('should debit an amount successfully if sufficient funds exist', () => {
    const wallet = Wallet.create('player-1', 1000n);
    wallet.debit(300n);
    expect(wallet.balance).toBe(700n);
    expect(wallet.version).toBe(2);
  });

  it('should throw InsufficientFundsException when debit amount exceeds balance', () => {
    const wallet = Wallet.create('player-1', 1000n);
    expect(() => wallet.debit(1100n)).toThrow(InsufficientFundsException);
  });

  it('should not allow debiting a negative or zero amount', () => {
    const wallet = Wallet.create('player-1', 1000n);
    expect(() => wallet.debit(0n)).toThrow(DomainException);
    expect(() => wallet.debit(-10n)).toThrow(DomainException);
  });
});
