import { describe, expect, test } from 'bun:test';
import { Bet } from '../../src/domain/entities/bet.entity';
import { BetStatus } from '../../src/domain/enums/bet-status.enum';
import { InvalidBetAmountException } from '../../src/domain/exceptions/invalid-bet-amount.exception';

describe('Bet Entity', () => {
  describe('creation', () => {
    test('should successfully create a bet with valid player and amount', () => {
      const playerId = 'player-123';
      const amount = 1050n; // R$10.50

      const bet = Bet.create(playerId, amount);

      expect(bet.playerId).toBe(playerId);
      expect(bet.amount).toBe(amount);
      expect(bet.status).toBe(BetStatus.PENDING);
      expect(bet.multiplier).toBeNull();
      expect(bet.payout).toBeNull();
      expect(bet.cashedAt).toBeNull();
      expect(bet.placedAt).toBeInstanceOf(Date);
    });

    test('should throw InvalidBetAmountException when amount is below minimum (1.00 BRL)', () => {
      const playerId = 'player-123';
      const amount = 99n; // R$0.99

      expect(() => {
        Bet.create(playerId, amount);
      }).toThrow(InvalidBetAmountException);
    });

    test('should throw InvalidBetAmountException when amount is above maximum (1000.00 BRL)', () => {
      const playerId = 'player-123';
      const amount = 100001n; // R$1000.01

      expect(() => {
        Bet.create(playerId, amount);
      }).toThrow(InvalidBetAmountException);
    });

    test('should throw an error when player ID is empty', () => {
      expect(() => {
        Bet.create('', 1000n);
      }).toThrow();
    });
  });

  describe('cashout', () => {
    test('should successfully transition to WON and calculate payout correctly', () => {
      const bet = Bet.create('player-123', 1000n); // R$10.00
      const multiplier = 1.54;

      bet.cashout(multiplier);

      expect(bet.status).toBe(BetStatus.WON);
      expect(bet.multiplier).toBe(multiplier);
      expect(bet.payout).toBe(1540n); // 1000 * 1.54 = 1540 (R$15.40)
      expect(bet.cashedAt).toBeInstanceOf(Date);
    });

    test('should handle decimal multipliers correctly without floats in money', () => {
      const bet = Bet.create('player-123', 1050n); // R$10.50
      const multiplier = 2.37;

      bet.cashout(multiplier);

      expect(bet.payout).toBe(2488n); // Math.floor(1050 * 2.37) = Math.floor(24.885 * 100) = 2488 (R$24.88)
    });

    test('should throw an error if already finalized (WON)', () => {
      const bet = Bet.create('player-123', 1000n);
      bet.cashout(1.50);

      expect(() => {
        bet.cashout(2.00);
      }).toThrow('Aposta já finalizada');
    });

    test('should throw an error if already finalized (LOST)', () => {
      const bet = Bet.create('player-123', 1000n);
      bet.lose();

      expect(() => {
        bet.cashout(2.00);
      }).toThrow('Aposta já finalizada');
    });

    test('should throw an error if multiplier is less than 1.00', () => {
      const bet = Bet.create('player-123', 1000n);

      expect(() => {
        bet.cashout(0.99);
      }).toThrow('O multiplicador deve ser de pelo menos 1.00');
    });
  });

  describe('lose', () => {
    test('should successfully transition to LOST with zero payout', () => {
      const bet = Bet.create('player-123', 1000n);

      bet.lose();

      expect(bet.status).toBe(BetStatus.LOST);
      expect(bet.payout).toBe(0n);
    });

    test('should throw an error if already finalized (WON)', () => {
      const bet = Bet.create('player-123', 1000n);
      bet.cashout(1.50);

      expect(() => {
        bet.lose();
      }).toThrow('Aposta já finalizada');
    });
  });
});
