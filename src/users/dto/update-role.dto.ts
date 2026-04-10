import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({
    enum: ['admin', 'me_staff', 'programme_staff', 'viewer'],
    example: 'me_staff',
  })
  @IsIn(['admin', 'me_staff', 'programme_staff', 'viewer'])
  role: string;
}
