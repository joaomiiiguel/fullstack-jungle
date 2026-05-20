import { Wallet } from '../entities/wallet.entity';

export interface IWalletRepository {
  findById(playerId: string): Promise<Wallet | null>;
  save(wallet: Wallet): Promise<void>;
}
