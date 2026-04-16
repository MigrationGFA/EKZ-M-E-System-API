import { IsNumber, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProgressDto {
  @ApiProperty({ example: 3450, description: 'Progress value to record' })
  @IsNumber()
  value: number;

  @ApiProperty({
    example: '2026-04-13T00:00:00Z',
    description: 'Date of the progress entry',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Q1 field verification complete' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'Funke Ogunleye',
    description: 'Display name of the person logging progress',
  })
  @IsString()
  submittedBy: string;
}
