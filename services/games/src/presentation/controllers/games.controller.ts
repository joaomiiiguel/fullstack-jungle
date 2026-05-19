import { Controller, Get, Post, Body, Param, UseGuards, Req, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlaceBetUseCase } from '../../application/use-cases/place-bet.use-case';
import { CashoutUseCase } from '../../application/use-cases/cashout.use-case';

class PlaceBetDto {
  roundId: string;
  amount: number;
}

class CashoutDto {
  roundId: string;
  multiplier: number;
}

@Controller('games')
export class GamesController {
  constructor(
    @Inject('PlaceBetUseCase') private readonly placeBetUseCase: PlaceBetUseCase,
    @Inject('CashoutUseCase') private readonly cashoutUseCase: CashoutUseCase,
  ) {}

  @Get('rounds/current')
  async getCurrentRound() {
    // Implement current round query
    return { status: 'mocked', data: 'current round data' };
  }

  @Get('rounds/history')
  async getRoundsHistory() {
    // Implement history query
    return { status: 'mocked', data: 'history data' };
  }

  @Get('rounds/:roundId/verify')
  async verifyRound(@Param('roundId') roundId: string) {
    // Implement round verification using ProvablyFairService
    return { status: 'mocked', data: `verification for ${roundId}` };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('bets/me')
  async getMyBets(@Req() req: any) {
    const userId = req.user.userId;
    // Implement fetching bets for current user
    return { status: 'mocked', data: `bets for ${userId}` };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('bet')
  async placeBet(@Body() dto: PlaceBetDto, @Req() req: any) {
    const userId = req.user.userId;
    // amount in UseCase is BigInt for money precision as per DDD
    const amountBigInt = BigInt(Math.floor(dto.amount * 100)); // converting decimal to integer cents
    const round = await this.placeBetUseCase.execute(dto.roundId, userId, amountBigInt);
    return { success: true, roundId: round.id };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('bet/cashout')
  async cashout(@Body() dto: CashoutDto, @Req() req: any) {
    const userId = req.user.userId;
    const round = await this.cashoutUseCase.execute(dto.roundId, userId, dto.multiplier);
    return { success: true, roundId: round.id };
  }
}
