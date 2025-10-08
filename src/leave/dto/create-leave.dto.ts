import { IsDateString, IsOptional, IsString, IsUUID, Length, IsBoolean, IsArray, ValidateIf } from 'class-validator';

export class CreateLeaveDto {
  @ValidateIf(o => !o.isCustomDates)
  @IsDateString()
  startDate?: string;

  @ValidateIf(o => !o.isCustomDates)
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCustomDates?: boolean;

  @ValidateIf(o => o.isCustomDates)
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
}
