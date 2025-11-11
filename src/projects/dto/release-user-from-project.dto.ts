import { IsNotEmpty, IsOptional, IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ReleaseUserFromProjectDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  releaseDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
