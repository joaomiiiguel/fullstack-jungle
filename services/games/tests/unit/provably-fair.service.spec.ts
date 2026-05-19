import { describe, expect, test } from 'bun:test';
import { ProvablyFairService } from '../../src/domain/services/provably-fair.service';
import * as crypto from 'crypto';

describe('ProvablyFairService', () => {
  const service = new ProvablyFairService();

  describe('generateServerSeed', () => {
    test('deve gerar uma string hexadecimal de 64 caracteres (32 bytes)', () => {
      const seed = service.generateServerSeed();
      expect(seed).toBeString();
      expect(seed).toHaveLength(64);
      expect(/^[0-9a-fA-F]+$/.test(seed)).toBe(true);
    });

    test('deve gerar seeds aleatórias e distintas', () => {
      const seed1 = service.generateServerSeed();
      const seed2 = service.generateServerSeed();
      expect(seed1).not.toBe(seed2);
    });
  });

  describe('generateHashChain', () => {
    test('deve gerar uma cadeia de hashes com o tamanho correto', () => {
      const startSeed = 'd9b296a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1';
      const length = 10;
      const chain = service.generateHashChain(startSeed, length);
      
      expect(chain).toHaveLength(length);
    });

    test('deve respeitar a regra de hash chain reversa (hashing de chain[i] resulta em chain[i-1])', () => {
      const startSeed = service.generateServerSeed();
      const length = 5;
      const chain = service.generateHashChain(startSeed, length);
      
      // O último elemento da cadeia retornada deve ser a startSeed original
      expect(chain[length - 1]).toBe(startSeed);

      // Cada elemento chain[i] após o index 0 deve ser o SHA256 do elemento chain[i-1] original (ou seja, se subirmos a cadeia)
      // Como a cadeia está invertida, se calcularmos o SHA256 de chain[i], devemos obter chain[i-1].
      for (let i = 1; i < length; i++) {
        const hash = crypto.createHash('sha256').update(chain[i]).digest('hex');
        expect(hash).toBe(chain[i - 1]);
      }
    });
  });

  describe('calculateCrashPoint', () => {
    const clientSeed = '0000000000000000000000000000000000000000000000000000000000000000';

    test('deve calcular o ponto de crash deterministicamente para uma seed específica', () => {
      const serverSeed = 'abc123xyz789';
      const crashPoint1 = service.calculateCrashPoint(serverSeed, clientSeed);
      const crashPoint2 = service.calculateCrashPoint(serverSeed, clientSeed);

      expect(crashPoint1).toBe(crashPoint2);
      expect(crashPoint1).toBeGreaterThanOrEqual(1.00);
    });

    test('deve retornar 1.00 se o hash for divisível por 101 (instant crash / house edge)', () => {
      // Procurando uma seed que gere um HMAC divisível por 101 usando o clientSeed padrão
      let foundServerSeed = '';
      for (let i = 0; i < 1000; i++) {
        const seedCandidate = `candidate-${i}`;
        const hmac = crypto
          .createHmac('sha256', clientSeed)
          .update(seedCandidate)
          .digest('hex');
        
        const hex = hmac.slice(0, 13);
        const val = parseInt(hex, 16);
        if (val % 101 === 0) {
          foundServerSeed = seedCandidate;
          break;
        }
      }

      expect(foundServerSeed).not.toBeEmpty();
      const crashPoint = service.calculateCrashPoint(foundServerSeed, clientSeed);
      expect(crashPoint).toBe(1.00);
    });
  });

  describe('verifySeed', () => {
    test('deve verificar com sucesso se a seed corresponde ao hash esperado', () => {
      const seed = 'minha-seed-secreta';
      const expectedHash = crypto.createHash('sha256').update(seed).digest('hex');

      expect(service.verifySeed(seed, expectedHash)).toBe(true);
      expect(service.verifySeed('outra-seed', expectedHash)).toBe(false);
    });
  });
});
