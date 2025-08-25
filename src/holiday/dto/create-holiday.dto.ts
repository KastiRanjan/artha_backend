import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateHolidayDto {
  @IsDateString()
  date: string; // AD date

  @IsString()
  @Length(1, 20)
  type: string;

  @IsString()
  @Length(1, 100)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  bsDate?: string; // BS date (optional)
}
