import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExampleService } from './example.service';
import { PublishExampleEventDto } from './dto/publish-example-event.dto';

/**
 * Api archetype sample — REST endpoint that publishes to RabbitMQ.
 *
 * Try it:
 *   curl -X POST http://localhost:3000/example/events \
 *     -H 'Content-Type: application/json' \
 *     -d '{"type":"example.created","payload":{"message":"hello"}}'
 */
@ApiTags('example')
@Controller('example')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Post('events')
  @ApiOperation({ summary: 'Publish a domain event to RabbitMQ (api archetype)' })
  publish(
    @Body() dto: PublishExampleEventDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.exampleService.publishEvent(dto.type, dto.payload, correlationId);
  }
}
