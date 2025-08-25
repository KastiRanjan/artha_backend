import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateLeaveDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @Length(1, 30)
  type: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
