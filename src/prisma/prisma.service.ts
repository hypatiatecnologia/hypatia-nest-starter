import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Injectable Prisma client.
 *
 * Schema: `prisma/schema.prisma`
 * Migrations: `prisma/migrations/` — run `npx prisma migrate dev` locally,
 *             `npx prisma migrate deploy` in CI/production.
 *
 * Usage (PrismaModule is global — just inject):
 *   constructor(private readonly prisma: PrismaService) {}
 *   await this.prisma.serviceHealthCheck.findMany();
 *
 * Model delegates (`prisma.<model>`) are generated from the schema by
 * `prisma generate` — if a model is missing after editing the schema,
 * regenerate (it also runs on npm install via postinstall).
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
