import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { TodoTaskStatus } from '../entities/todo-task.entity';

export class CreateTodoTaskDto {
  @IsNotEmpty()
  @IsUUID()
  titleId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  taskTypeId: string;

  @IsNotEmpty()
  @IsUUID()
  assignedToId: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  informToIds?: string[];
}