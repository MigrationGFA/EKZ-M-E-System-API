import { IsUUID, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({
    description: 'Client-generated submission UUID (used in the blob path)',
  })
  @IsUUID()
  submissionId: string;

  @ApiProperty({ description: 'Form field ID (used in the blob path)' })
  @IsString()
  fieldId: string;

  @ApiProperty({
    description:
      'Full data URL: "data:image/<mime>;base64,<data>". Max 10 MB decoded.',
    example: 'data:image/jpeg;base64,/9j/4AAQ...',
  })
  @IsString()
  @Matches(/^data:image\/(jpeg|jpg|png|gif|webp|heic);base64,/, {
    message:
      'base64 must be a valid image data URL (jpeg, png, gif, webp, or heic)',
  })
  @MaxLength(14_000_000, { message: 'Image exceeds the 10 MB limit' })
  base64: string;
}
