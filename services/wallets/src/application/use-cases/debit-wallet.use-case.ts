import { Wallet } from '../../domain/entities/wallet.entity';
import { IWalletRepository } from '../../domain/repositories/wallet-repository.interface';

export class DebitWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  public async execute(playerId: string, amount: bigint): Promise<Wallet> {
    const wallet = await this.walletRepository.findById(playerId);
    if (!wallet) {
      throw new Error(`Carteira não encontrada para o jogador ${playerId}`);
    }

    wallet.debit(amount);
    await this.walletRepository.save(wallet);

    return wallet;
  }
}
