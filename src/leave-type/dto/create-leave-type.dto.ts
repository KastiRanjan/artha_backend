import { IsString, IsOptional, IsNumber, IsBoolean, MinLength, MaxLength, Min, Max } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  maxDaysPerYear?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
