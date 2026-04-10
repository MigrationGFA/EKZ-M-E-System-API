import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkIndicatorDto {
  @ApiProperty({ description: 'UUID of the indicator to link to this node' })
  @IsUUID()
  indicator_id: string;
}
