import { IsIn, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Event types THIS service is allowed to publish. Keep the allowlist — an
 * open `type` field lets any caller forge events (e.g. `order.paid`) on the
 * shared exchange. Replace with your domain's event catalog.
 */
export const EXAMPLE_EVENT_TYPES = ['example.created'] as const;

/** Request body for POST /example/events — replace with your domain DTOs. */
export class PublishExampleEventDto {
  @ApiProperty({ example: 'example.created', enum: EXAMPLE_EVENT_TYPES })
  @IsString()
  @IsNotEmpty()
  @IsIn(EXAMPLE_EVENT_TYPES)
  type!: (typeof EXAMPLE_EVENT_TYPES)[number];

  @ApiProperty({ example: { message: 'hello from api' } })
  @IsObject()
  payload!: Record<string, unknown>;
}
