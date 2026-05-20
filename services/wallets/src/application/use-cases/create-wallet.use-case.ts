import { Wallet } from '../../domain/entities/wallet.entity';
import { IWalletRepository } from '../../domain/repositories/wallet-repository.interface';
import { DomainException } from '../../domain/exceptions/domain.exception';

export class CreateWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  public async execute(playerId: string): Promise<Wallet> {
    const existing = await this.walletRepository.findById(playerId);
    if (existing) {
      throw new DomainException(`Carteira já existente para o jogador ${playerId}`);
    }

    const wallet = Wallet.create(playerId, 0n);
    await this.walletRepository.save(wallet);

    return wallet;
  }
}
