import { redactPayload, DEFAULT_SENSITIVE_FIELDS } from './redact-payload';

describe('redactPayload', () => {
  it('masks top-level sensitive fields with a fixed mask (no length leak)', () => {
    const input = { password: 'secret123', name: 'Alice' };

    const result = redactPayload(input);

    expect(result.password).toBe('[REDACTED]');
    expect(result.name).toBe('Alice');
  });

  it('masks nested sensitive fields case-insensitively', () => {
    const input = {
      user: {
        Email: 'alice@example.com',
        profile: { apiKey: 'key-abc' },
      },
    };

    const result = redactPayload(input);

    expect(result.user.Email).toBe('[REDACTED]');
    expect(result.user.profile.apiKey).toBe('[REDACTED]');
  });

  it('redacts arrays of objects', () => {
    const input = {
      items: [{ token: 'abc' }, { token: 'def' }],
    };

    const result = redactPayload(input);

    expect(result.items[0].token).toBe('[REDACTED]');
    expect(result.items[1].token).toBe('[REDACTED]');
  });

  it('uses custom sensitive field list', () => {
    const input = { customField: 'visible', note: 'hide-me' };

    const result = redactPayload(input, ['note']);

    expect(result.customField).toBe('visible');
    expect(result.note).toBe('[REDACTED]');
  });

  it('exports default sensitive fields', () => {
    expect(DEFAULT_SENSITIVE_FIELDS).toContain('password');
    expect(DEFAULT_SENSITIVE_FIELDS).toContain('cpf');
  });
});
