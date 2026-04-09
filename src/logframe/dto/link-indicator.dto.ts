import { IsUUID } from 'class-validator';

export class LinkIndicatorDto {
  @IsUUID()
  indicator_id: string;
}
