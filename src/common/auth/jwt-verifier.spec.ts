import { createHmac } from 'crypto';
import { verifyHs256Jwt } from './jwt-verifier';

function createToken(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

describe('verifyHs256Jwt', () => {
  const secret = 'test-secret';

  it('accepts a valid token', () => {
    const token = createToken({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 60 }, secret);
    expect(verifyHs256Jwt(token, secret)).toBe(true);
  });

  it('rejects tokens signed with a different secret', () => {
    const token = createToken({ sub: 'user-1' }, 'other-secret');
    expect(verifyHs256Jwt(token, secret)).toBe(false);
  });

  it('rejects expired tokens', () => {
    const token = createToken({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 60 }, secret);
    expect(verifyHs256Jwt(token, secret)).toBe(false);
  });

  it('rejects malformed tokens', () => {
    expect(verifyHs256Jwt('not-a-jwt', secret)).toBe(false);
  });
});
