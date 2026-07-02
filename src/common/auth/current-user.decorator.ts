import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from './auth.types';

/**
 * Injects the authenticated identity set by JwtAuthGuard.
 *
 *   @Get('me')
 *   me(@CurrentUser() user: AuthenticatedUser) { return { sub: user.sub }; }
 *
 * Undefined only on @Public routes (the guard never ran authentication).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined =>
    context.switchToHttp().getRequest<Request>().user,
);
