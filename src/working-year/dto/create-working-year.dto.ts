import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator';

export class CreateWorkingYearDto {
  @IsNotEmpty()
  @IsString()
  name: string; // e.g. "2081/82"

  @IsNotEmpty()
  @IsInt()
  nepaliStartYear: number; // e.g. 2081

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  nepaliStartMonth?: number = 5; // Default: 5 (Bhadra)

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(32)
  nepaliStartDay?: number = 1; // Default: 1

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsString()
  description?: string;
}
