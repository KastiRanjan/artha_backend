import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AttendanceRecordDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsString()
  status: 'present' | 'absent' | 'excused' | 'late';

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class MarkAttendanceDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];

  @IsOptional()
  autoLogWorklog?: boolean;
}
