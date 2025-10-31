import { IsUUID, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class AllocateLeaveDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  leaveTypeId: string;

  @IsInt()
  @Min(2024)
  year: number;

  @IsNumber()
  @Min(0)
  allocatedDays: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carriedOverDays?: number;
}
