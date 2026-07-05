import { createSecretKey } from 'crypto';
import { jwtVerify, JWTPayload } from 'jose';

export interface JwtVerifyOptions {
  /** When set, `iss` must match — rejects tokens minted for other issuers. */
  issuer?: string;
  /** When set, `aud` must contain this value — prevents cross-service token reuse. */
  audience?: string;
}

/**
 * Verifies an HS256 JWT issued by Argus (or compatible issuers) via `jose`.
 *
 * Enforced: signature, algorithm pinned to HS256, `exp` required (no eternal
 * tokens), 5s clock tolerance, and optional `iss`/`aud` claims.
 *
 * Why pin the algorithm: honoring whatever `alg` the token header declares is
 * a classic vulnerability (alg=none skips verification entirely; RS256 public
 * keys reused as HS256 secrets forge valid signatures). We decide the
 * algorithm, never the token.
 *
 * Returns the verified payload, or null when the token is invalid.
 */
export async function verifyHs256Jwt(
  token: string,
  secret: string,
  options: JwtVerifyOptions = {},
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, createSecretKey(Buffer.from(secret, 'utf8')), {
      algorithms: ['HS256'],
      requiredClaims: ['exp'],
      clockTolerance: 5,
      ...(options.issuer ? { issuer: options.issuer } : {}),
      ...(options.audience ? { audience: options.audience } : {}),
    });
    return payload;
  } catch {
    return null;
  }
}
