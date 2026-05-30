const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'secret',
  'cpf',
  'email',
  'phone',
  'creditCard',
  'credit_card',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
];

/**
 * Recursively masks sensitive field values in objects before logging.
 * Field names are matched case-insensitively against the provided list.
 */
export function redactPayload<T extends Record<string, unknown>>(
  target: T,
  sensitiveFields: string[] = DEFAULT_SENSITIVE_FIELDS,
): T {
  const normalizedFields = new Set(sensitiveFields.map((field) => field.toLowerCase()));

  const redactNode = (value: unknown): unknown => {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(redactNode);
    }

    if (typeof value !== 'object') {
      return value;
    }

    const entries = Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
      if (normalizedFields.has(key.toLowerCase()) && nested !== undefined && nested !== null) {
        return [key, '*'.repeat(String(nested).length)];
      }

      return [key, redactNode(nested)];
    });

    return Object.fromEntries(entries);
  };

  return redactNode(target) as T;
}

export { DEFAULT_SENSITIVE_FIELDS };
