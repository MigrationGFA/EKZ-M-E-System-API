import { IsString } from 'class-validator';

export class CreateTokenDto {
  @IsString()
  name: string;
}
