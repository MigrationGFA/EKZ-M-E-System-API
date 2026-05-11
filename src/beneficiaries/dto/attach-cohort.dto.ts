import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttachCohortDto {
  @ApiProperty({ example: 'youth' })
  @IsString()
  code: string;
}
