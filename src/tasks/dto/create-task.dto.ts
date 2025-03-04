import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import e = require('express');

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  assineeId?: string[];

  @IsOptional()
  @Type(() => String)
  projectId?: string;

  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @IsOptional()
  @Type(() => Date)
  group?: string;

  @IsOptional()
  tcode?: string;

  @IsOptional()
  status?: 'open' | 'in_progress' | 'done';

  @IsOptional()
  priority?: 'critical' | 'high' | 'medium' | 'low';

  @IsOptional()
  @Type(() => String)
  parentTaskId?: string;
  
  @IsOptional()
  @Type(() => String)
  groupId?: string;
}
