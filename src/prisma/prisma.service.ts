import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Injectable Prisma client.
 *
 * Schema: `prisma/schema.prisma`
 * Migrations: `prisma/migrations/` — run `npx prisma migrate dev` locally,
 *             `npx prisma migrate deploy` in CI/production.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
