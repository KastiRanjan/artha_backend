import { IsUUID, IsInt, IsOptional, IsArray, Min } from 'class-validator';

export class CarryOverLeaveDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[]; // If not provided, applies to all users

  @IsInt()
  @Min(2024)
  fromYear: number;

  @IsInt()
  @Min(2024)
  toYear: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  leaveTypeIds?: string[]; // If not provided, applies to all leave types that allow carry over
}
