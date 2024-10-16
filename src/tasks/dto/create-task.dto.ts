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
  @Type(() => Number)
  groupId?: number;

  @IsOptional()
  @Type(() => Number)
  projectId?: number;

  @IsOptional()
  @Type(() => Number)
  parentTaskId?: number;
}
