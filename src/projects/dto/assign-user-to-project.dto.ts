import { IsNotEmpty, IsOptional, IsBoolean, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignUserToProjectDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  plannedReleaseDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
