import { createHmac, timingSafeEqual } from 'crypto';

interface JwtPayload {
  exp?: number;
  sub?: string;
}

function decodeBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
}

function parsePayload(encodedPayload: string): JwtPayload | null {
  try {
    const parsed = JSON.parse(decodeBase64Url(encodedPayload).toString('utf8')) as JwtPayload;
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function isExpired(payload: JwtPayload): boolean {
  if (typeof payload.exp !== 'number') {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}

/** Verifies HS256 JWT signatures issued by Argus (or compatible issuers). */
export function verifyHs256Jwt(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    return false;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expected = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  const received = decodeBase64Url(signature);
  const expectedBuffer = decodeBase64Url(expected);

  if (received.length !== expectedBuffer.length) {
    return false;
  }

  if (!timingSafeEqual(received, expectedBuffer)) {
    return false;
  }

  const payload = parsePayload(encodedPayload);
  return payload !== null && !isExpired(payload);
}
