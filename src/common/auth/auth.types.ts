import { JWTPayload } from 'jose';

/**
 * Identity attached to `request.user` by JwtAuthGuard after authentication.
 *
 * Read it in handlers via the `@CurrentUser()` decorator. Authorization
 * (roles/permissions) should build on `claims` — see docs/adr.
 */
export interface AuthenticatedUser {
  /** JWT `sub` claim; undefined for internal API key callers. */
  sub?: string;
  method: 'jwt' | 'api_key';
  /** Full verified JWT payload (empty object for API key auth). */
  claims: JWTPayload;
}
