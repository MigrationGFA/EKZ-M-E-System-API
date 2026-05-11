import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  BeneficiaryAgeBand,
  BeneficiarySex,
  ConsentMethod,
} from '../beneficiary.entity.js';

const SEX_VALUES: BeneficiarySex[] = ['female', 'male', 'other', 'prefer_not'];
const AGE_BAND_VALUES: BeneficiaryAgeBand[] = [
  'under_18',
  '18_24',
  '25_34',
  '35_plus',
];
const CONSENT_METHOD_VALUES: ConsentMethod[] = [
  'paper_signature',
  'digital_signature',
  'verbal_recorded',
  'sms_opt_in',
];

export class CreateBeneficiaryDto {
  @ApiPropertyOptional({
    description:
      'Optional client-generated UUID. Required for offline registrations so the same record syncs idempotently.',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Adeola Adeyemi' })
  @IsString()
  @Length(1, 255)
  full_name: string;

  @ApiProperty({ enum: SEX_VALUES })
  @IsIn(SEX_VALUES)
  sex: BeneficiarySex;

  @ApiPropertyOptional({ example: '1998-04-12' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({ enum: AGE_BAND_VALUES })
  @IsOptional()
  @IsIn(AGE_BAND_VALUES)
  age_band?: BeneficiaryAgeBand;

  @ApiPropertyOptional({ example: 'Ago Araromi' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  community?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  household_id?: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'E.164 phone number. Redacted in list endpoints.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone_e164 must be E.164 format' })
  phone_e164?: string;

  @ApiPropertyOptional({
    description:
      'Raw NIN — hashed server-side before persistence (ADR 0006). Never round-trips back to clients.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/, { message: 'NIN must be 11 digits' })
  national_id_raw?: string;

  @ApiPropertyOptional({ example: 'basic' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  skill_level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  disability_status?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description:
      'Required. Per ADR 0006 a beneficiary record is only permitted without consent for aggregate-only entries.',
  })
  @IsBoolean()
  consent_given: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  consent_date?: string;

  @ApiPropertyOptional({ enum: CONSENT_METHOD_VALUES })
  @IsOptional()
  @IsIn(CONSENT_METHOD_VALUES)
  consent_method?: ConsentMethod;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Cohort codes to attach explicitly. Derived cohorts are added automatically.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cohort_codes?: string[];
}
