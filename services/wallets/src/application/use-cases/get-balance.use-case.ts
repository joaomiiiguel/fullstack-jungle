import { IWalletRepository } from '../../domain/repositories/wallet-repository.interface';

export class GetBalanceUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  public async execute(playerId: string): Promise<bigint> {
    const wallet = await this.walletRepository.findById(playerId);
    if (!wallet) {
      throw new Error(`Carteira não encontrada para o jogador ${playerId}`);
    }

    return wallet.balance;
  }
}
