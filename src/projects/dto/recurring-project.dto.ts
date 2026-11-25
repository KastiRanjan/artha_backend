import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const EmptyToUndefined = () =>
  Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value
  );

export enum RecurrenceFrequencyEnum {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  YEARLY = 'yearly',
}

export class CreateRecurringProjectDto {
  @IsString()
  @Length(1, 120)
  namePattern: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  description?: string;

  @IsUUID()
  customerId: string;

  @IsUUID()
  natureOfWorkId: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  natureOfWorkGroupId?: string;

  @IsEnum(RecurrenceFrequencyEnum)
  frequency: RecurrenceFrequencyEnum;

  @IsDateString()
  nextRunDate: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(366)
  durationDays?: number;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  projectLeadId?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  projectManagerId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  userIds?: string[];

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  workingYearId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRecurringProjectDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  namePattern?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  natureOfWorkId?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  natureOfWorkGroupId?: string;

  @IsOptional()
  @IsEnum(RecurrenceFrequencyEnum)
  frequency?: RecurrenceFrequencyEnum;

  @IsOptional()
  @IsDateString()
  nextRunDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(366)
  durationDays?: number;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  projectLeadId?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  projectManagerId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  userIds?: string[];

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  workingYearId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
