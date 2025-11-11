import { IsOptional, IsBoolean, IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserAssignmentDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  plannedReleaseDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  releaseDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
