import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IWalletRepository } from '../../../domain/repositories/wallet-repository.interface';
import { Wallet } from '../../../domain/entities/wallet.entity';
import { WalletOrmEntity } from '../entities/wallet.orm-entity';

@Injectable()
export class WalletRepository implements IWalletRepository {
  constructor(
    @InjectRepository(WalletOrmEntity)
    private readonly ormRepository: Repository<WalletOrmEntity>,
  ) {}

  public async findById(playerId: string): Promise<Wallet | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { playerId } });
    if (!ormEntity) {
      return null;
    }

    const wallet = new Wallet(ormEntity.playerId, BigInt(ormEntity.balance));
    wallet.version = ormEntity.version;
    wallet.createdAt = ormEntity.createdAt;
    wallet.updatedAt = ormEntity.updatedAt;

    return wallet;
  }

  public async save(wallet: Wallet): Promise<void> {
    const ormEntity = this.ormRepository.create({
      playerId: wallet.playerId,
      balance: wallet.balance.toString(),
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });

    await this.ormRepository.save(ormEntity);
  }
}
