import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  assineeId?: number[];

  @IsOptional()
  @Type(() => Number)
  projectId?: number;

  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @IsOptional()
  @Type(() => Number)
  parentTaskId?: number;
}
