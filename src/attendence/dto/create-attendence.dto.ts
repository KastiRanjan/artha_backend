import { IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsNotEmpty()
  @IsOptional()
  date: string;

  @IsOptional()
  @IsString()
  clockIn?: string;

  @IsOptional()
  clockOut?: string;

  @IsOptional() //
  @IsLatitude()
  latitude?: string;

  @IsOptional()
  @IsLongitude()
  longitude?: string;
}