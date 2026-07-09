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
  const futureExp = () => Math.floor(Date.now() / 1000) + 60;

  it('accepts a valid token and returns its payload', async () => {
    const token = createToken({ sub: 'user-1', exp: futureExp() }, secret);
    const payload = await verifyHs256Jwt(token, secret);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('user-1');
  });

  it('rejects tokens signed with a different secret', async () => {
    const token = createToken({ sub: 'user-1', exp: futureExp() }, 'other-secret');
    expect(await verifyHs256Jwt(token, secret)).toBeNull();
  });

  it('rejects expired tokens', async () => {
    const token = createToken({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 60 }, secret);
    expect(await verifyHs256Jwt(token, secret)).toBeNull();
  });

  it('rejects tokens without exp (no eternal tokens)', async () => {
    const token = createToken({ sub: 'user-1' }, secret);
    expect(await verifyHs256Jwt(token, secret)).toBeNull();
  });

  it('rejects tokens without sub (no anonymous identity)', async () => {
    const token = createToken({ exp: futureExp() }, secret);
    expect(await verifyHs256Jwt(token, secret)).toBeNull();
  });

  it('rejects tokens with empty or whitespace-only sub', async () => {
    const empty = createToken({ sub: '', exp: futureExp() }, secret);
    const blank = createToken({ sub: '   ', exp: futureExp() }, secret);

    expect(await verifyHs256Jwt(empty, secret)).toBeNull();
    expect(await verifyHs256Jwt(blank, secret)).toBeNull();
  });

  it('rejects malformed tokens', async () => {
    expect(await verifyHs256Jwt('not-a-jwt', secret)).toBeNull();
  });

  it('enforces issuer when configured', async () => {
    const good = createToken({ sub: 'u', exp: futureExp(), iss: 'argus' }, secret);
    const bad = createToken({ sub: 'u', exp: futureExp(), iss: 'someone-else' }, secret);

    expect(await verifyHs256Jwt(good, secret, { issuer: 'argus' })).not.toBeNull();
    expect(await verifyHs256Jwt(bad, secret, { issuer: 'argus' })).toBeNull();
  });

  it('enforces audience when configured', async () => {
    const good = createToken({ sub: 'u', exp: futureExp(), aud: 'athena-core' }, secret);
    const bad = createToken({ sub: 'u', exp: futureExp(), aud: 'midas-payment' }, secret);

    expect(await verifyHs256Jwt(good, secret, { audience: 'athena-core' })).not.toBeNull();
    expect(await verifyHs256Jwt(bad, secret, { audience: 'athena-core' })).toBeNull();
  });

  it('rejects alg=none tokens', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ sub: 'u', exp: futureExp() })).toString('base64url');

    expect(await verifyHs256Jwt(`${header}.${body}.`, secret)).toBeNull();
  });
});
