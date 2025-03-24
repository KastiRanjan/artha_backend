import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class BulkUpdateTaskDto {
  @IsOptional()
  @IsArray()
  taskIds: string[];

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  assigneeIds?: string[];
}