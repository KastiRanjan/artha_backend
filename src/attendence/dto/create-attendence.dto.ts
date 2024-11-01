import { IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsNotEmpty()
  date: string;

  @IsString()
  clockIn?: string;

  @IsOptional()
  clockOut?: string;

  @IsOptional() //
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}