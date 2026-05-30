import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  function createHost(correlationId?: string) {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', url: '/example', correlationId }),
      }),
    } as unknown as ArgumentsHost;

    return { host, status, json };
  }

  it('maps HttpException to its status code', () => {
    const { host, status, json } = createHost();

    filter.catch(new BadRequestException('invalid input'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'invalid input',
        path: '/example',
      }),
    );
  });

  it('includes correlationId in error responses when present', () => {
    const { host, json } = createHost('corr-abc');

    filter.catch(new BadRequestException('invalid input'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'corr-abc',
      }),
    );
  });

  it('maps unknown errors to 500', () => {
    const { host, status, json } = createHost();

    filter.catch(new Error('unexpected'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  });
});
