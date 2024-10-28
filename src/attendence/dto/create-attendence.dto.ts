import { IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateAttendanceDto {
  @IsNumber()
  userId: string;

  @IsEnum(['check-in', 'check-out'])
  action: 'check-in' | 'check-out';

  @IsNotEmpty()
  timestamp: Date;

  @IsOptional() // Optional if latitude/longitude are not always required
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}