import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkhourDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsInt()
  @Min(1)
  hours: number;
}
