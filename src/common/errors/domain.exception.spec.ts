import { HttpStatus, NotFoundException } from '@nestjs/common';
import { DomainException, resolveErrorCode } from './domain.exception';

describe('DomainException', () => {
  it('creates exception with stable code and default status', () => {
    const error = new DomainException('not_found', 'Order not found');

    expect(error.code).toBe('not_found');
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('allows custom status override', () => {
    const error = new DomainException('custom_code', 'Custom', HttpStatus.UNPROCESSABLE_ENTITY);

    expect(error.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });
});

describe('resolveErrorCode', () => {
  it('returns code from DomainException', () => {
    expect(resolveErrorCode(new DomainException('order_not_found', 'missing'))).toBe(
      'order_not_found',
    );
  });

  it('returns code from HttpException body when present', () => {
    const error = new DomainException('conflict', 'Duplicate');
    expect(resolveErrorCode(error)).toBe('conflict');
  });

  it('maps standard HttpException status to stable code', () => {
    expect(resolveErrorCode(new NotFoundException('missing'))).toBe('not_found');
  });

  it('returns internal_error for unknown errors', () => {
    expect(resolveErrorCode(new Error('boom'))).toBe('internal_error');
  });
});
