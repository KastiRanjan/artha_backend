import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorklogDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  endTime?: Date;

  @IsOptional()
  @Type(() => Number)
  userId: number;

  @IsNotEmpty()
  @Type(() => Number)
  taskId: number;
}
