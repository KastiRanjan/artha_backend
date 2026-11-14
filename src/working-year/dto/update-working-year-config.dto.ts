import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateWorkingYearConfigDto {
  @IsInt()
  @Min(1)
  @Max(12)
  defaultStartMonth: number; // 1-12 (5 = Bhadra)

  @IsInt()
  @Min(1)
  @Max(32)
  defaultStartDay: number; // 1-32

  @IsOptional()
  @IsString()
  description?: string;
}
