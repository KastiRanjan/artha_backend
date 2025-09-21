import { IsInt, IsOptional, IsString, Min, IsDateString } from 'class-validator';

export class CreateWorkhourDto {
  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsInt()
  @Min(1)
  workHours: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;
}
