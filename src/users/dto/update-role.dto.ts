import { IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsIn(['admin', 'me_staff', 'programme_staff', 'viewer'])
  role: string;
}
