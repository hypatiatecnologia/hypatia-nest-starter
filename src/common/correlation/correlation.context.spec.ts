import { CorrelationContext, resolveCorrelationId } from './correlation.context';

describe('resolveCorrelationId', () => {
  it('returns trimmed header value when provided', () => {
    expect(resolveCorrelationId('  abc-123  ')).toBe('abc-123');
  });

  it('returns first non-empty value from header array', () => {
    expect(resolveCorrelationId(['', '  def-456  '])).toBe('def-456');
  });

  it('generates a uuid when header is missing', () => {
    expect(resolveCorrelationId(undefined)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

describe('CorrelationContext', () => {
  it('stores and retrieves the correlation id within run()', () => {
    CorrelationContext.run('ctx-1', () => {
      expect(CorrelationContext.get()).toBe('ctx-1');
    });
  });

  it('resolve() prefers explicit value over stored context', () => {
    CorrelationContext.run('ctx-1', () => {
      expect(CorrelationContext.resolve('explicit')).toBe('explicit');
    });
  });

  it('resolve() falls back to stored context', () => {
    CorrelationContext.run('ctx-1', () => {
      expect(CorrelationContext.resolve()).toBe('ctx-1');
    });
  });
});
