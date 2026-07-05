import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './auth.constants';

/**
 * Marks a route (or a whole controller) as accessible without JWT or API key.
 *
 * Auth here is deny-by-default: JwtAuthGuard runs globally and this decorator
 * is the only escape hatch — so an unprotected endpoint is always a visible,
 * greppable decision (`grep -r "@Public"`), never a forgotten guard.
 * Rate limiting still applies to public routes.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
