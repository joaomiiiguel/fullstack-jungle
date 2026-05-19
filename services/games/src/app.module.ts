import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GamesController } from "./presentation/controllers/games.controller";
import { MessagingModule } from "./infrastructure/messaging/messaging.module";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { AuthModule } from "./infrastructure/auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    MessagingModule,
    AuthModule,
  ],
  controllers: [GamesController],
})
export class AppModule {}
