import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TaskSuperItemDto {
  @ApiProperty({ description: 'Task Super ID' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'New name for task super in project' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

class TaskGroupItemDto {
  @ApiProperty({ description: 'Task Group ID' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'New name for task group in project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Associated task super ID' })
  @IsUUID()
  @IsOptional()
  taskSuperId?: string;
}

class TaskTemplateItemDto {
  @ApiProperty({ description: 'Task Template ID' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'New name for task template in project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Budgeted hours for this task' })
  @IsNumber()
  budgetedHours: number;

  @ApiProperty({ description: 'Associated task group ID' })
  @IsUUID()
  @IsOptional()
  taskGroupId?: string;
}

class SubtaskItemDto {
  @ApiProperty({ description: 'Subtask ID' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'New name for subtask in project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Budgeted hours for this subtask' })
  @IsNumber()
  budgetedHours: number;

  @ApiProperty({ description: 'Parent task template ID' })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class AddFromTemplatesDto {
  @ApiProperty({ description: 'Project ID to add tasks to' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'Task Super items to add', type: [TaskSuperItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskSuperItemDto)
  @IsOptional()
  taskSupers: TaskSuperItemDto[];

  @ApiProperty({ description: 'Task Group items to add', type: [TaskGroupItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskGroupItemDto)
  @IsOptional()
  taskGroups: TaskGroupItemDto[];

  @ApiProperty({ description: 'Task Template items to add', type: [TaskTemplateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskTemplateItemDto)
  @IsOptional()
  taskTemplates: TaskTemplateItemDto[];

  @ApiProperty({ description: 'Subtask items to add', type: [SubtaskItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtaskItemDto)
  @IsOptional()
  subtasks: SubtaskItemDto[];
}