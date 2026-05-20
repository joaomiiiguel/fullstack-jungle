import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

@Entity('wallets')
export class WalletOrmEntity {
  @PrimaryColumn({ type: 'varchar', name: 'player_id' })
  playerId: string;

  // BIGINT to store cents safely without floating point issues.
  // In TypeORM + Postgres, 'bigint' is returned as a string to prevent precision loss.
  @Column({ type: 'bigint', default: 0 })
  balance: string;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
