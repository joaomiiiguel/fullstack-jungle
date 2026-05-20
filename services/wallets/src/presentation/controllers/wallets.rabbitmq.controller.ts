import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreditWalletUseCase } from '../../application/use-cases/credit-wallet.use-case';
import { DebitWalletUseCase } from '../../application/use-cases/debit-wallet.use-case';
import { CreateWalletUseCase } from '../../application/use-cases/create-wallet.use-case';

@Controller()
export class WalletsRabbitMQController {
  constructor(
    @Inject('CreditWalletUseCase') private readonly creditWalletUseCase: CreditWalletUseCase,
    @Inject('DebitWalletUseCase') private readonly debitWalletUseCase: DebitWalletUseCase,
    @Inject('CreateWalletUseCase') private readonly createWalletUseCase: CreateWalletUseCase,
  ) {}

  @EventPattern('BetPlacedEvent')
  async handleBetPlaced(@Payload() data: any) {
    const playerId = data.playerId;
    const amount = BigInt(data.amount);

    try {
      await this.ensureWalletExists(playerId);
      await this.debitWalletUseCase.execute(playerId, amount);
      console.log(`[RabbitMQ] Debited ${amount} from player ${playerId} for BetPlacedEvent`);
    } catch (error: any) {
      console.error(`[RabbitMQ] Error debiting wallet for player ${playerId}:`, error.message);
    }
  }

  @EventPattern('BetCashoutCompletedEvent')
  async handleBetCashoutCompleted(@Payload() data: any) {
    const playerId = data.playerId;
    const payout = BigInt(data.payout);

    try {
      await this.ensureWalletExists(playerId);
      await this.creditWalletUseCase.execute(playerId, payout);
      console.log(`[RabbitMQ] Credited ${payout} to player ${playerId} for BetCashoutCompletedEvent`);
    } catch (error: any) {
      console.error(`[RabbitMQ] Error crediting wallet for player ${playerId}:`, error.message);
    }
  }

  private async ensureWalletExists(playerId: string) {
    try {
      await this.createWalletUseCase.execute(playerId);
      console.log(`[RabbitMQ] Auto-created wallet for player ${playerId}`);
    } catch (e: any) {
      // Ignora erro se já existe (DomainException)
    }
  }
}
