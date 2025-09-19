import { IsString, IsUUID, IsOptional, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SelectedTemplateDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsUUID()
  groupId: string;

  @ApiProperty()
  @IsString()
  groupName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  budgetedHours?: number;
  
  @ApiProperty({ required: false })
  @IsOptional()
  rank?: number; // Added rank property
}

class SelectedSubtaskDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsUUID()
  templateId: string;

  @ApiProperty()
  @IsString()
  templateName: string;

  @ApiProperty()
  @IsUUID()
  groupId: string;

  @ApiProperty()
  @IsString()
  groupName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  budgetedHours?: number;
  
  @ApiProperty({ required: false })
  @IsOptional()
  rank?: number; // Added rank property
}

// Original DTO format
export class AddToProjectDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsUUID()
  taskSuperId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  suffixTaskSuper?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  suffixTaskGroup?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  suffixTaskTemplate?: string;

  @ApiProperty({ type: [SelectedTemplateDto] })
  @IsArray()
  @IsOptional() // Make it optional for the new format
  selectedTemplates?: SelectedTemplateDto[];

  @ApiProperty({ type: [SelectedSubtaskDto] })
  @IsArray()
  @IsOptional() // Make it optional for the new format
  selectedSubtasks?: SelectedSubtaskDto[];
  
  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any; // Additional metadata for the request
}

// Item type for new format
export class ItemDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsEnum(['taskSuper', 'taskGroup', 'template', 'subtask'])
  type: 'taskSuper' | 'taskGroup' | 'template' | 'subtask';

  @ApiProperty()
  @IsString()
  originalName: string;

  @ApiProperty()
  @IsString()
  name: string;
  
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  budgetedHours?: number;
  
  @ApiProperty({ required: false })
  @IsOptional()
  rank?: number; // Added rank property

  @ApiProperty({ required: false })
  @IsOptional()
  parentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  groupId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  taskSuperId?: string;
}

// New DTO format
export class AddToProjectNewFormatDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsUUID()
  taskSuperId: string;

  @ApiProperty({ type: [ItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}