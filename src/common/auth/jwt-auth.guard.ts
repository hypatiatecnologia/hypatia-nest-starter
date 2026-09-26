import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createHash, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { AppConfig } from '../../config/configuration';
import { DomainException } from '../errors/domain.exception';
import { API_KEY_HEADER, IS_PUBLIC_KEY } from './auth.constants';
import { AuthenticatedUser } from './auth.types';
import { verifyHs256Jwt } from './jwt-verifier';

/**
 * Global authentication guard — registered via APP_GUARD in AppModule, so it
 * runs on EVERY route by default. Routes opt out explicitly with @Public()
 * (health probes do); everything else must present one of:
 *
 *   1. `Authorization: Bearer <jwt>` — HS256 token from the auth service
 *   2. `x-api-key: <key>`           — interim service-to-service auth
 *
 * JWT is tried first because it carries identity (sub, claims); the API key
 * is an anonymous fallback. Failures never reveal WHICH check failed — a
 * uniform 401 gives callers nothing to enumerate.
 *
 * On success the identity lands on `request.user`; read it in handlers with
 * the @CurrentUser() decorator.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = await this.authenticate(request);
    if (user) {
      request.user = user;
      return true;
    }

    throw new DomainException('unauthorized', 'Unauthorized');
  }

  private async authenticate(request: Request): Promise<AuthenticatedUser | null> {
    const bearerToken = this.extractBearerToken(request.headers.authorization);
    const argusJwtSecret = this.config.get('argusJwtSecret', { infer: true });

    if (bearerToken && argusJwtSecret) {
      const payload = await verifyHs256Jwt(bearerToken, argusJwtSecret, {
        issuer: this.config.get('argusJwtIssuer', { infer: true }),
        audience: this.config.get('argusJwtAudience', { infer: true }),
      });
      if (payload) {
        return { sub: payload.sub, method: 'jwt', claims: payload };
      }
    }

    const internalApiKey = this.config.get('internalApiKey', { infer: true });
    const providedApiKey = request.headers[API_KEY_HEADER];
    const apiKey = Array.isArray(providedApiKey) ? providedApiKey[0] : providedApiKey;

    if (internalApiKey && apiKey && constantTimeEquals(apiKey, internalApiKey)) {
      return { method: 'api_key', claims: {} };
    }

    return null;
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.slice('Bearer '.length).trim();
    return token || null;
  }
}

// Why not `a === b`? String comparison returns at the first differing byte, so
// response timing would leak how many leading characters an attacker guessed
// right, letting them brute-force the key char by char. timingSafeEqual always
// compares every byte; hashing first equalizes lengths, so the comparison
// leaks neither content nor length.
function constantTimeEquals(a: string, b: string): boolean {
  const digestA = createHash('sha256').update(a).digest();
  const digestB = createHash('sha256').update(b).digest();
  return timingSafeEqual(digestA, digestB);
}
