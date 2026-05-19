import * as crypto from 'crypto';

export class ProvablyFairService {
  /**
   * Gera uma seed aleatória para o servidor (representada em hexadecimal de 32 bytes).
   */
  public generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Gera uma cadeia de hashes (hash chain) a partir de uma seed inicial secreta.
   * Cada elemento é o SHA-256 do elemento anterior.
   * 
   * A cadeia é retornada na ordem em que as rodadas serão jogadas (inversa da geração).
   * 
   * @param startSeed A seed inicial secreta (ex: gerada aleatoriamente).
   * @param length O tamanho da cadeia (quantidade de rodadas).
   * @returns Array de hashes/seeds pronto para ser jogado do index 0 ao length-1.
   */
  public generateHashChain(startSeed: string, length: number): string[] {
    const chain: string[] = [];
    let current = startSeed;

    for (let i = 0; i < length; i++) {
      chain.push(current);
      current = crypto.createHash('sha256').update(current).digest('hex');
    }

    // Retorna a cadeia invertida para que o primeiro elemento a ser jogado
    // seja o hash mais externo (terminating hash), mantendo a propriedade de que
    // hash[i] = SHA256(hash[i+1]).
    return chain.reverse();
  }

  /**
   * Calcula o ponto de crash (multiplicador) a partir da seed do servidor e seed do cliente usando HMAC-SHA256 e a fórmula de 52 bits.
   * 
   * @param serverSeed A seed secreta revelada do servidor (ou hash da rodada).
   * @param clientSeed A seed pública do cliente (ex: hash de um bloco do bitcoin ou string fixa).
   * @returns O multiplicador final (ex: 1.00, 2.54, etc.).
   */
  public calculateCrashPoint(serverSeed: string, clientSeed: string): number {
    // 1. Calcula o HMAC-SHA256 usando o clientSeed como chave e o serverSeed como mensagem
    const hmac = crypto
      .createHmac('sha256', clientSeed)
      .update(serverSeed)
      .digest('hex');

    // 2. Verifica se o resultado é divisível por 101 para aplicar o house edge de ~1% (crash instantâneo em 1.00x)
    if (this.isDivisible(hmac, 101)) {
      return 1.00;
    }

    // 3. Extrai os primeiros 13 caracteres hexadecimais (52 bits)
    const hex = hmac.slice(0, 13);
    const val = parseInt(hex, 16);

    // 4. Aplica a fórmula de 52 bits
    const e = Math.pow(2, 52);

    // crashPoint = Math.floor((100 * e - val) / (e - val)) / 100
    const multiplier = Math.floor((100 * e - val) / (e - val)) / 100;

    // Retorna pelo menos 1.00x
    return Math.max(1.00, multiplier);
  }

  /**
   * Verifica se a seed fornecida corresponde ao hash esperado.
   */
  public verifySeed(serverSeed: string, expectedHash: string): boolean {
    const hash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    return hash === expectedHash;
  }

  /**
   * Verifica se os primeiros 13 caracteres hexadecimais do HMAC (52 bits) convertidos para inteiro são divisíveis pelo mod especificado.
   */
  private isDivisible(hmac: string, mod: number): boolean {
    const hex = hmac.slice(0, 13);
    const val = parseInt(hex, 16);
    return val % mod === 0;
  }
}
