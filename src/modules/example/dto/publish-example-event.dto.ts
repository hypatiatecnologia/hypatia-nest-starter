import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Request body for POST /example/events — replace with your domain DTOs. */
export class PublishExampleEventDto {
  @ApiProperty({ example: 'example.created', description: 'Routing key / event type' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ example: { message: 'hello from api' } })
  @IsObject()
  payload!: Record<string, unknown>;
}
