import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createHmac } from 'crypto';
import { Request } from 'express';
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

function buildContext(options: { authorization?: string; apiKey?: string }): {
  context: ExecutionContext;
  request: Request;
} {
  const request = {
    headers: {
      ...(options.authorization ? { authorization: options.authorization } : {}),
      ...(options.apiKey ? { [API_KEY_HEADER]: options.apiKey } : {}),
    },
  } as unknown as Request;

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;

  return { context, request };
}

describe('JwtAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const config = {
    get: jest.fn(),
  } as unknown as ConfigService<AppConfig, true>;

  let guard: JwtAuthGuard;

  function mockConfig(values: Partial<Record<string, unknown>>): void {
    (config.get as jest.Mock).mockImplementation((key: string) => values[key]);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(reflector, config);
  });

  it('allows public routes without authenticating', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const { context, request } = buildContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  it('allows requests with a valid bearer token and populates request.user', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    mockConfig({ argusJwtSecret: 'jwt-secret' });

    const token = createToken(
      { sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 60 },
      'jwt-secret',
    );
    const { context, request } = buildContext({ authorization: `Bearer ${token}` });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject({ sub: 'user-1', method: 'jwt' });
    expect(request.user?.claims.sub).toBe('user-1');
  });

  it('rejects bearer tokens with the wrong issuer', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    mockConfig({ argusJwtSecret: 'jwt-secret', argusJwtIssuer: 'argus' });

    const token = createToken(
      { sub: 'user-1', iss: 'other-issuer', exp: Math.floor(Date.now() / 1000) + 60 },
      'jwt-secret',
    );
    const { context } = buildContext({ authorization: `Bearer ${token}` });

    await expect(guard.canActivate(context)).rejects.toThrow(DomainException);
  });

  it('allows requests with a valid internal API key', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    mockConfig({ internalApiKey: 'local-api-key' });

    const { context, request } = buildContext({ apiKey: 'local-api-key' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject({ method: 'api_key' });
  });

  it('rejects wrong API keys, including different lengths', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    mockConfig({ internalApiKey: 'local-api-key' });

    await expect(guard.canActivate(buildContext({ apiKey: 'wrong' }).context)).rejects.toThrow(
      DomainException,
    );
    await expect(
      guard.canActivate(buildContext({ apiKey: 'local-api-key-extra' }).context),
    ).rejects.toThrow(DomainException);
  });

  it('rejects unauthorized requests', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    mockConfig({});

    await expect(guard.canActivate(buildContext({}).context)).rejects.toThrow(DomainException);
  });
});
