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
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @Type(() => Number)
  assignees?: number[]; // Array of user IDs

  @IsOptional()
  @Type(() => Number)
  reporterId: number;

  @IsNotEmpty()
  @Type(() => Number)
  groupId?: number;

  @IsNotEmpty()
  @Type(() => Number)
  projectId: number;

  @IsNotEmpty()
  @Type(() => Number)
  taskId: number;
}
