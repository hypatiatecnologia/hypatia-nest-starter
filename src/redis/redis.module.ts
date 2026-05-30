import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/** Global Redis client — used for caching, distributed locks, and event dedupe. */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
