import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletOrmEntity } from './entities/wallet.orm-entity';
import { WalletRepository } from './repositories/wallet.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // Auto-sync in dev (use migrations in prod)
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([WalletOrmEntity]),
  ],
  providers: [
    {
      provide: 'IWalletRepository',
      useClass: WalletRepository,
    },
  ],
  exports: [TypeOrmModule, 'IWalletRepository'],
})
export class DatabaseModule {}
