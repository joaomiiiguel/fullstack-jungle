import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { AuthModule } from "./infrastructure/auth/auth.module";
import { MessagingModule } from "./infrastructure/messaging/messaging.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    MessagingModule,
  ],
  controllers: [WalletsController],
})
export class AppModule {}
