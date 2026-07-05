import { withTimeout } from './with-timeout';

describe('withTimeout', () => {
  afterEach(() => jest.useRealTimers());

  it('resolves with the promise value when it settles in time', async () => {
    await expect(withTimeout(Promise.resolve('done'), 1000, 'op')).resolves.toBe('done');
  });

  it('propagates the original rejection when it settles in time', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 1000, 'op')).rejects.toThrow(
      'boom',
    );
  });

  it('rejects with a labeled error when the promise never settles', async () => {
    jest.useFakeTimers();

    const promise = withTimeout(new Promise<never>(() => undefined), 500, 'RabbitMQ publish');
    const assertion = expect(promise).rejects.toThrow('RabbitMQ publish timed out after 500ms');
    await jest.runAllTimersAsync();

    await assertion;
  });
});
