import { IsString, IsEmail, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({ example: 'Grace Okonkwo' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'g.okonkwo@ekz.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: ['admin', 'me_staff', 'programme_staff', 'viewer'],
    example: 'me_staff',
  })
  @IsIn(['admin', 'me_staff', 'programme_staff', 'viewer'])
  role: string;
}
