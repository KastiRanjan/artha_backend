import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

const EmptyToUndefined = () =>
  Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value
  );

export enum RenewalFrequency {
  EVERY_YEAR = 'every_year',
  EVERY_3_YEARS = 'every_3_years',
  EVERY_5_YEARS = 'every_5_years',
  MORE_THAN_5_YEARS = 'more_than_5_years',
  RENEWAL_NOT_REQUIRED = 'renewal_not_required',
}

export class CreateLicenseDto {
  @IsString()
  @Length(1, 100)
  statutoryAuthority: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 100)
  registrationLicenseNo?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsDateString()
  dateOfIssue?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsDateString()
  validDate?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsEnum(RenewalFrequency)
  frequencyOfRenewal?: RenewalFrequency;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  reminderDaysBefore?: number;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  notes?: string;
}

export class UpdateLicenseDto extends CreateLicenseDto {}
