import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { WalletsRabbitMQController } from "./presentation/controllers/wallets.rabbitmq.controller";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { AuthModule } from "./infrastructure/auth/auth.module";
import { MessagingModule } from "./infrastructure/messaging/messaging.module";

import { CreateWalletUseCase } from "./application/use-cases/create-wallet.use-case";
import { GetBalanceUseCase } from "./application/use-cases/get-balance.use-case";
import { CreditWalletUseCase } from "./application/use-cases/credit-wallet.use-case";
import { DebitWalletUseCase } from "./application/use-cases/debit-wallet.use-case";
import { IWalletRepository } from "./domain/repositories/wallet-repository.interface";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    MessagingModule,
  ],
  controllers: [WalletsController, WalletsRabbitMQController],
  providers: [
    {
      provide: 'CreateWalletUseCase',
      useFactory: (repo: IWalletRepository) => new CreateWalletUseCase(repo),
      inject: ['IWalletRepository'],
    },
    {
      provide: 'GetBalanceUseCase',
      useFactory: (repo: IWalletRepository) => new GetBalanceUseCase(repo),
      inject: ['IWalletRepository'],
    },
    {
      provide: 'CreditWalletUseCase',
      useFactory: (repo: IWalletRepository) => new CreditWalletUseCase(repo),
      inject: ['IWalletRepository'],
    },
    {
      provide: 'DebitWalletUseCase',
      useFactory: (repo: IWalletRepository) => new DebitWalletUseCase(repo),
      inject: ['IWalletRepository'],
    },
  ],
})
export class AppModule {}
