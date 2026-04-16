import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Password12$' })
  @IsString()
  current_password: string;

  @ApiProperty({
    example: 'NewSecure99!',
    description:
      'Min 8 characters. Must contain at least one uppercase letter, one number, and one special character.',
  })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/, {
    message:
      'new_password must contain at least one uppercase letter, one number, and one special character',
  })
  new_password: string;
}
