import { describe, expect, test } from 'bun:test';
import { Round } from '../../src/domain/entities/round.entity';
import { RoundStatus } from '../../src/domain/enums/round-status.enum';
import { BetStatus } from '../../src/domain/enums/bet-status.enum';
import { InvalidRoundStateException } from '../../src/domain/exceptions/invalid-round-state.exception';
import { BetAlreadyPlacedException } from '../../src/domain/exceptions/bet-already-placed.exception';
import { BetNotFoundException } from '../../src/domain/exceptions/bet-not-found.exception';
import { RoundCreatedEvent } from '../../src/domain/events/round-created.event';
import { RoundStartedEvent } from '../../src/domain/events/round-started.event';
import { RoundCrashedEvent } from '../../src/domain/events/round-crashed.event';
import { BetPlacedEvent } from '../../src/domain/events/bet-placed.event';
import { BetCashoutRequestedEvent } from '../../src/domain/events/bet-cashout-requested.event';
import { BetCashoutCompletedEvent } from '../../src/domain/events/bet-cashout-completed.event';
import { Bet } from '../../src/domain/entities/bet.entity';

describe('Round Aggregate Root', () => {
  const roundId = 'round-uuid';
  const seed = 'server-seed-string';
  const hash = 'hashed-seed-string';
  const crashPoint = 2.54;

  describe('creation', () => {
    test('should successfully create a round in BETTING status and register created event', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);

      expect(round.id).toBe(roundId);
      expect(round.seed).toBe(seed);
      expect(round.hash).toBe(hash);
      expect(round.crashPoint).toBe(crashPoint);
      expect(round.status).toBe(RoundStatus.BETTING);
      expect(round.startedAt).toBeNull();
      expect(round.crashedAt).toBeNull();
      expect(round.finishedAt).toBeNull();
      expect(round.bets).toEqual([]);

      const events = round.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(RoundCreatedEvent);
      expect((events[0] as RoundCreatedEvent).roundId).toBe(roundId);
      expect((events[0] as RoundCreatedEvent).hash).toBe(hash);
    });

    test('should throw error when crash point is less than 1.00', () => {
      expect(() => {
        Round.create(roundId, seed, hash, 0.99);
      }).toThrow('O ponto de crash deve ser de pelo menos 1.00');
    });
  });

  describe('placeBet', () => {
    test('should allow placing a bet during BETTING status and register event', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);
      const playerId = 'player-1';
      const amount = 1000n;

      round.placeBet(playerId, amount);

      expect(round.bets).toHaveLength(1);
      expect(round.bets[0].playerId).toBe(playerId);
      expect(round.bets[0].amount).toBe(amount);
      expect(round.bets[0].status).toBe(BetStatus.PENDING);

      const events = round.getDomainEvents();
      expect(events).toHaveLength(2); // Created + Placed
      expect(events[1]).toBeInstanceOf(BetPlacedEvent);
      expect((events[1] as BetPlacedEvent).playerId).toBe(playerId);
      expect((events[1] as BetPlacedEvent).amount).toBe(amount);
    });

    test('should throw BetAlreadyPlacedException if player bets twice in the same round', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);
      const playerId = 'player-1';

      round.placeBet(playerId, 1000n);

      expect(() => {
        round.placeBet(playerId, 2000n);
      }).toThrow(BetAlreadyPlacedException);
    });

    test('should throw InvalidRoundStateException if placing bet when round is not BETTING', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);
      round.start();

      expect(() => {
        round.placeBet('player-1', 1000n);
      }).toThrow(InvalidRoundStateException);
    });
  });

  describe('start', () => {
    test('should transition to RUNNING state and register event', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);

      round.start();

      expect(round.status).toBe(RoundStatus.RUNNING);
      expect(round.startedAt).toBeInstanceOf(Date);

      const events = round.getDomainEvents();
      expect(events).toHaveLength(2); // Created + Started
      expect(events[1]).toBeInstanceOf(RoundStartedEvent);
    });

    test('should throw InvalidRoundStateException if starting a non-betting round', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);
      round.start(); // transitions to RUNNING

      expect(() => {
        round.start();
      }).toThrow(InvalidRoundStateException);
    });
  });

  describe('cashout', () => {
    test('should successfully cashout if requested multiplier is below crashPoint', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);
      const playerId = 'player-1';
      round.placeBet(playerId, 1000n);
      round.start();

      round.requestCashout(playerId, 1.50);

      const bet = round.bets.find(b => b.playerId === playerId);
      expect(bet?.status).toBe(BetStatus.WON);
      expect(bet?.multiplier).toBe(1.50);
      expect(bet?.payout).toBe(1500n);

      const events = round.getDomainEvents();
      // Events: Created, Placed, Started, CashoutRequested, CashoutCompleted
      expect(events).toHaveLength(5);
      expect(events[3]).toBeInstanceOf(BetCashoutRequestedEvent);
      expect(events[4]).toBeInstanceOf(BetCashoutCompletedEvent);

      const compEvent = events[4] as BetCashoutCompletedEvent;
      expect(compEvent.playerId).toBe(playerId);
      expect(compEvent.multiplier).toBe(1.50);
      expect(compEvent.payout).toBe(1500n);
    });

    test('should NOT complete cashout if requested multiplier is equal to or greater than crashPoint', () => {
      const round = Round.create(roundId, seed, hash, crashPoint); // crashPoint = 2.54
      const playerId = 'player-1';
      round.placeBet(playerId, 1000n);
      round.start();

      round.requestCashout(playerId, 2.54); // Equal to crashPoint

      const bet = round.bets.find(b => b.playerId === playerId);
      expect(bet?.status).toBe(BetStatus.PENDING); // Stays pending/active

      const events = round.getDomainEvents();
      // Events: Created, Placed, Started, CashoutRequested. No CashoutCompleted.
      expect(events).toHaveLength(4);
      expect(events[3]).toBeInstanceOf(BetCashoutRequestedEvent);
    });

    test('should throw BetNotFoundException if cashing out a non-existent bet', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);
      round.start();

      expect(() => {
        round.requestCashout('unknown-player', 1.50);
      }).toThrow(BetNotFoundException);
    });

    test('should throw InvalidRoundStateException if cashing out in non-running status', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);
      round.placeBet('player-1', 1000n);
      // Still in BETTING

      expect(() => {
        round.requestCashout('player-1', 1.50);
      }).toThrow(InvalidRoundStateException);
    });
  });

  describe('crash', () => {
    test('should transition to CRASHED, mark pending bets as LOST, and register event', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);
      round.placeBet('player-win', 1000n);
      round.placeBet('player-lose', 1000n);
      round.start();

      // player-win successfully cashes out
      round.requestCashout('player-win', 2.00);

      // now round crashes
      round.crash();

      expect(round.status).toBe(RoundStatus.CRASHED);
      expect(round.crashedAt).toBeInstanceOf(Date);

      const winBet = round.bets.find(b => b.playerId === 'player-win');
      const loseBet = round.bets.find(b => b.playerId === 'player-lose');

      expect(winBet?.status).toBe(BetStatus.WON);
      expect(loseBet?.status).toBe(BetStatus.LOST);
      expect(loseBet?.payout).toBe(0n);

      const events = round.getDomainEvents();
      // Last event should be RoundCrashedEvent
      const lastEvent = events[events.length - 1];
      expect(lastEvent).toBeInstanceOf(RoundCrashedEvent);
      expect((lastEvent as RoundCrashedEvent).crashPoint).toBe(crashPoint);
    });

    test('should throw InvalidRoundStateException if crashing a non-running round', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);

      expect(() => {
        round.crash();
      }).toThrow(InvalidRoundStateException);
    });
  });

  describe('finish', () => {
    test('should transition to FINISHED from CRASHED status', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);
      round.start();
      round.crash();

      round.finish();

      expect(round.status).toBe(RoundStatus.FINISHED);
      expect(round.finishedAt).toBeInstanceOf(Date);
    });

    test('should throw InvalidRoundStateException if finishing a round that is not crashed', () => {
      const round = Round.create(roundId, seed, hash, crashPoint);

      expect(() => {
        round.finish();
      }).toThrow(InvalidRoundStateException);
    });
  });

  describe('reconstitute', () => {
    test('should successfully reconstruct a round with all history and bets', () => {
      const createdAt = new Date('2026-05-19T10:00:00Z');
      const startedAt = new Date('2026-05-19T10:00:10Z');
      const crashedAt = new Date('2026-05-19T10:00:15Z');
      const finishedAt = new Date('2026-05-19T10:00:20Z');

      const bet1 = Bet.create('player-1', 1000n);
      bet1.cashout(1.50, startedAt);

      const bet2 = Bet.create('player-2', 2000n);
      bet2.lose();

      const round = Round.reconstitute(
        roundId,
        seed,
        hash,
        crashPoint,
        RoundStatus.FINISHED,
        createdAt,
        startedAt,
        crashedAt,
        finishedAt,
        [bet1, bet2],
      );

      expect(round.id).toBe(roundId);
      expect(round.status).toBe(RoundStatus.FINISHED);
      expect(round.bets).toHaveLength(2);
      expect(round.bets.find(b => b.playerId === 'player-1')?.status).toBe(BetStatus.WON);
      expect(round.bets.find(b => b.playerId === 'player-2')?.status).toBe(BetStatus.LOST);
      expect(round.getDomainEvents()).toHaveLength(0); // reconstituted entities do not emit historical events
    });
  });
});
