import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTokenDto {
  @ApiProperty({ example: 'Tableau Integration' })
  @IsString()
  name: string;
}
