import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTaskTemplateDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

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
