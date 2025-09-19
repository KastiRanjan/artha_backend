import { IsString, IsUUID, IsOptional, IsArray, IsBoolean, ValidateNested, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Base entity with common properties
class BaseEntityDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rank?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;
}

// Subtask Template Entity
class SubtaskTemplateDto extends BaseEntityDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  budgetedHours?: number;
}

// Task Template Entity
class TaskTemplateDto extends BaseEntityDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  budgetedHours?: number;

  @ApiProperty({ type: [SubtaskTemplateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtaskTemplateDto)
  subtasks: SubtaskTemplateDto[];
}

// Task Group Entity
class TaskGroupDto extends BaseEntityDto {
  @ApiProperty({ type: [TaskTemplateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskTemplateDto)
  templates: TaskTemplateDto[];
}

// Task Super Entity
class TaskSuperDto extends BaseEntityDto {
  @ApiProperty({ type: [TaskGroupDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskGroupDto)
  groups: TaskGroupDto[];
}

// Main DTO for hierarchical project assignment
export class HierarchicalProjectAssignDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ type: [TaskSuperDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskSuperDto)
  taskSupers: TaskSuperDto[];
}