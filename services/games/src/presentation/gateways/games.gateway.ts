import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GamesGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // --- Broadcast Methods ---
  
  emitMultiplierUpdate(multiplier: number) {
    this.server.emit('multiplier_update', { multiplier });
  }

  emitRoundStarted(roundId: string, startedAt: Date) {
    this.server.emit('round_started', { roundId, startedAt });
  }

  emitRoundBettingWindow(roundId: string, closesAt: Date) {
    this.server.emit('round_betting', { roundId, closesAt });
  }

  emitRoundCrashed(roundId: string, crashPoint: number, crashedAt: Date) {
    this.server.emit('round_crashed', { roundId, crashPoint, crashedAt });
  }

  emitBetPlaced(roundId: string, playerId: string, amount: bigint) {
    // BigInt needs to be stringified for JSON serialization
    this.server.emit('bet_placed', { roundId, playerId, amount: amount.toString() });
  }

  emitCashoutCompleted(roundId: string, playerId: string, multiplier: number, payout: bigint) {
    this.server.emit('cashout_completed', { roundId, playerId, multiplier, payout: payout.toString() });
  }
}
