import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTaskTemplateDto {
  @IsNotEmpty({ message: 'Task template name is required' })
  @IsString()
  @MinLength(1, { message: 'Task template name cannot be empty' })
  @MaxLength(100, { message: 'Task template name cannot exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  rank?: number;

  @IsOptional()
  @IsNumber()
  budgetedHours?: number;

  @IsNotEmpty()
  @Type(() => String)
  groupId?: string;

  @IsOptional()
  @Type(() => String)
  parentTaskId?: string;

  @IsOptional()
  @IsString()
  taskType?: 'story' | 'task';
}
