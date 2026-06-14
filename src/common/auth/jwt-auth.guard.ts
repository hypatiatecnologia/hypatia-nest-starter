import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AppConfig } from '../../config/configuration';
import { DomainException } from '../errors/domain.exception';
import { API_KEY_HEADER, IS_PUBLIC_KEY } from './auth.constants';
import { verifyHs256Jwt } from './jwt-verifier';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (this.isAuthorized(request)) {
      return true;
    }

    throw new DomainException('unauthorized', 'Unauthorized');
  }

  private isAuthorized(request: Request): boolean {
    const bearerToken = this.extractBearerToken(request.headers.authorization);
    const argusJwtSecret = this.config.get('argusJwtSecret', { infer: true });

    if (bearerToken && argusJwtSecret && verifyHs256Jwt(bearerToken, argusJwtSecret)) {
      return true;
    }

    const internalApiKey = this.config.get('internalApiKey', { infer: true });
    const providedApiKey = request.headers[API_KEY_HEADER];
    const apiKey = Array.isArray(providedApiKey) ? providedApiKey[0] : providedApiKey;

    return Boolean(internalApiKey && apiKey && apiKey === internalApiKey);
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.slice('Bearer '.length).trim();
    return token || null;
  }
}
