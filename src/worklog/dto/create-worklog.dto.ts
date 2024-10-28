import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator';

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
  @Type(() => String)
  userId: string;

  @IsNotEmpty()
  @Type(() => String)
  taskId: string;
}
