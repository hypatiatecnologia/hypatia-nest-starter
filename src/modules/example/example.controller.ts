import { Body, Controller, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExampleService } from './example.service';
import { PublishExampleEventDto } from './dto/publish-example-event.dto';
import { CORRELATION_ID_HEADER } from '../../common/correlation/correlation.constants';

/**
 * Api archetype sample — REST endpoint that publishes to RabbitMQ.
 *
 * Try it:
 *   curl -X POST http://localhost:3000/example/events \
 *     -H 'Content-Type: application/json' \
 *     -H 'x-correlation-id: my-trace-id' \
 *     -d '{"type":"example.created","payload":{"message":"hello"}}'
 */
@ApiTags('example')
@Controller('example')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Post('events')
  @ApiOperation({ summary: 'Publish a domain event to RabbitMQ (api archetype)' })
  @ApiHeader({
    name: CORRELATION_ID_HEADER,
    required: false,
    description: 'Optional trace id — generated and echoed when omitted',
  })
  publish(@Body() dto: PublishExampleEventDto) {
    return this.exampleService.publishEvent(dto.type, dto.payload);
  }
}
