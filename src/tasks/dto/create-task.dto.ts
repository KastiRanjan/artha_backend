import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum, IsArray, IsBoolean } from 'class-validator';

export enum TaskTypeEnum {
  STORY = 'story',
  TASK = 'task',
}

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true }) // Validate each element as a UUID v4
  assineeId?: string[];

  @IsNotEmpty() // Required in your service
  @IsUUID('4')  // Assuming projectId is a UUID
  projectId: string;

  @IsOptional()
  @IsString()   // Keep as string; TypeORM will convert to Date
  dueDate?: Date;

  @IsOptional()
  @IsUUID('4')  // Assuming groupId is a UUID
  groupId?: string;

  @IsOptional()
  @IsString()
  tcode?: string;

  @IsOptional()
  @IsBoolean()
  first?: boolean;

  @IsOptional()
  @IsBoolean()
  last?: boolean;

  @IsOptional()
  @IsEnum(['open', 'in_progress', 'done'])
  status?: 'open' | 'in_progress' | 'done';

  @IsOptional()
  @IsEnum(['critical', 'high', 'medium', 'low'])
  priority?: 'critical' | 'high' | 'medium' | 'low';

  @IsOptional()
  @IsUUID('4')  // Assuming parentTaskId is a UUID
  parentTaskId?: string;
    @IsOptional()
    @IsEnum(TaskTypeEnum)
    taskType?: TaskTypeEnum;
  }
