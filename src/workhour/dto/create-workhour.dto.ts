import { IsInt, IsNotEmpty, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class CreateWorkhourDto {
  @IsNotEmpty()
  @IsString()
  roleId: string;

  @IsInt()
  @Min(1)
  workHours: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsNotEmpty()
  @IsDateString()
  validFrom: string;
}
