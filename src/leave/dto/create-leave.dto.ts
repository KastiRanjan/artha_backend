import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  IsBoolean,
  IsArray,
  ValidateIf,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { FractionalType } from '../entities/leave.entity';

export class CreateLeaveDto {
  @ValidateIf((o) => !o.isCustomDates)
  @IsDateString()
  startDate?: string;

  @ValidateIf((o) => !o.isCustomDates)
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCustomDates?: boolean;

  @ValidateIf((o) => o.isCustomDates)
  @IsArray()
  @IsDateString({}, { each: true })
  customDates?: string[];

  @IsString()
  @Length(1, 30)
  type: string;

  @IsUUID()
  requestedManagerId: string;

  @IsOptional()
  @IsString()
  reason?: string;

  // Fractional Leave Support
  @IsOptional()
  @IsBoolean()
  isFractional?: boolean;

  @IsOptional()
  @IsEnum(['first_half', 'second_half', 'custom_hours'])
  fractionalType?: FractionalType;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  fractionalDuration?: number;
}
