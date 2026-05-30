declare namespace Express {
  interface Request {
    /** Set by correlationMiddleware on every HTTP request. */
    correlationId?: string;
  }
}
