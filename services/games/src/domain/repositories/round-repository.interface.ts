import { Round } from '../entities/round.entity';

export interface IRoundRepository {
  /**
   * Salva ou atualiza a rodada no repositório.
   */
  save(round: Round): Promise<void>;

  /**
   * Busca uma rodada pelo seu ID.
   */
  findById(id: string): Promise<Round | null>;

  /**
   * Busca a rodada ativa atual (se houver).
   */
  findCurrent(): Promise<Round | null>;
}
