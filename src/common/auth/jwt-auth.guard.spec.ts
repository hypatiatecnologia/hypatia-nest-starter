import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createHmac } from 'crypto';
import { AppConfig } from '../../config/configuration';
import { DomainException } from '../errors/domain.exception';
import { API_KEY_HEADER } from './auth.constants';
import { JwtAuthGuard } from './jwt-auth.guard';

function createToken(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function buildContext(options: {
  isPublic?: boolean;
  authorization?: string;
  apiKey?: string;
}): ExecutionContext {
  const request = {
    headers: {
      ...(options.authorization ? { authorization: options.authorization } : {}),
      ...(options.apiKey ? { [API_KEY_HEADER]: options.apiKey } : {}),
    },
  };

  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const config = {
    get: jest.fn(),
  } as unknown as ConfigService<AppConfig, true>;

  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(reflector, config);
  });

  it('allows public routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    expect(guard.canActivate(buildContext({}))).toBe(true);
  });

  it('allows requests with a valid bearer token', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (config.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'argusJwtSecret') return 'jwt-secret';
      if (key === 'internalApiKey') return undefined;
      return undefined;
    });

    const token = createToken(
      { sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 60 },
      'jwt-secret',
    );

    expect(guard.canActivate(buildContext({ authorization: `Bearer ${token}` }))).toBe(true);
  });

  it('allows requests with a valid internal API key', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (config.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'argusJwtSecret') return undefined;
      if (key === 'internalApiKey') return 'local-api-key';
      return undefined;
    });

    expect(guard.canActivate(buildContext({ apiKey: 'local-api-key' }))).toBe(true);
  });

  it('rejects unauthorized requests', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (config.get as jest.Mock).mockReturnValue(undefined);

    expect(() => guard.canActivate(buildContext({}))).toThrow(DomainException);
  });
});
