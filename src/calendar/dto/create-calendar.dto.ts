import { IsDateString, IsOptional, IsString, IsBoolean, Length } from 'class-validator';

export class CreateCalendarDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  bsDate?: string;

  @IsOptional()
  @IsString()
  dayOfWeek?: string;

  @IsBoolean()
  isHoliday: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  holidayTitle?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  holidayType?: string;
}
