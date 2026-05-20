import { Controller, Get, Post, UseGuards, Req, Inject, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetBalanceUseCase } from '../../application/use-cases/get-balance.use-case';
import { CreateWalletUseCase } from '../../application/use-cases/create-wallet.use-case';
import { HealthCheckResponseDto } from '../dtos/health-check-response.dto';

@Controller('wallets')
export class WalletsController {
  constructor(
    @Inject('GetBalanceUseCase') private readonly getBalanceUseCase: GetBalanceUseCase,
    @Inject('CreateWalletUseCase') private readonly createWalletUseCase: CreateWalletUseCase,
  ) {}

  @Get('health')
  check(): HealthCheckResponseDto {
    return { status: 'ok', service: 'wallets' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createWallet(@Req() req: any) {
    const userId = req.user.userId;
    try {
      const wallet = await this.createWalletUseCase.execute(userId);
      return { playerId: wallet.playerId, balance: wallet.balance.toString() };
    } catch (e: any) {
      if (e.name === 'DomainException' || e.message.includes('já existente')) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMyWallet(@Req() req: any) {
    const userId = req.user.userId;
    try {
      const balance = await this.getBalanceUseCase.execute(userId);
      return { playerId: userId, balance: balance.toString() };
    } catch (e: any) {
      if (e.message.includes('não encontrada')) {
        // Auto-create wallet on first access if not found (optional, mas mantido da sua base)
        const newWallet = await this.createWalletUseCase.execute(userId);
        return { playerId: userId, balance: newWallet.balance.toString() };
      }
      throw e;
    }
  }
}
