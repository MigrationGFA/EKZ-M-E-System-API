import { IsString, IsEmail, IsIn } from 'class-validator';

export class InviteUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsIn(['admin', 'me_staff', 'programme_staff', 'viewer'])
  role: string;
}
