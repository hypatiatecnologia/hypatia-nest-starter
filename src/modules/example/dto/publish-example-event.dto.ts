import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNotEmptyObject, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Event types THIS service is allowed to publish. Keep the allowlist — an
 * open `type` field lets any caller forge events (e.g. `order.paid`) on the
 * shared exchange. Replace with your domain's event catalog.
 */
export const EXAMPLE_EVENT_TYPES = ['example.created'] as const;

/** Typed payload for `example.created` — replace with your domain fields. */
export class ExampleEventPayloadDto {
  @ApiProperty({ example: 'hello from api' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

/** Request body for POST /example/events — replace with your domain DTOs. */
export class PublishExampleEventDto {
  @ApiProperty({ example: 'example.created', enum: EXAMPLE_EVENT_TYPES })
  @IsString()
  @IsNotEmpty()
  @IsIn(EXAMPLE_EVENT_TYPES)
  type!: (typeof EXAMPLE_EVENT_TYPES)[number];

  @ApiProperty({ type: ExampleEventPayloadDto, example: { message: 'hello from api' } })
  @ValidateNested()
  @Type(() => ExampleEventPayloadDto)
  @IsNotEmptyObject()
  payload!: ExampleEventPayloadDto;
}
