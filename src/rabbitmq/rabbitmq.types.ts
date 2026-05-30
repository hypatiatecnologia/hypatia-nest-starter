/**
 * Canonical event envelope for Hypatia async messaging.
 *
 * Every message published to `hypatia.events` MUST follow this shape.
 * Routing key on the topic exchange equals `type` (e.g. `order.created`).
 */
export interface HypatiaEvent<T = Record<string, unknown>> {
  /** Unique id — used for idempotent consumption (dedupe in Redis). */
  eventId: string;
  /** Dot-separated event name, used as routing key. */
  type: string;
  occurredAt: string;
  /** Propagate from HTTP `x-correlation-id` or upstream event. */
  correlationId?: string;
  payload: T;
}

export type EventHandler = (event: HypatiaEvent) => Promise<void>;
