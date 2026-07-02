declare namespace Express {
  interface Request {
    /** Set by correlationMiddleware on every HTTP request. */
    correlationId?: string;
    /** Set by JwtAuthGuard after successful authentication (absent on @Public routes). */
    user?: import('../common/auth/auth.types').AuthenticatedUser;
  }
}
