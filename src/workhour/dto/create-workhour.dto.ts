import { IsInt, IsOptional, IsString, Min } from 'class-validator';

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
}
