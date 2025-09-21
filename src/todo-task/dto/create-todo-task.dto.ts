import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { TodoTaskStatus } from '../entities/todo-task.entity';

export class CreateTodoTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  taskTypeId: string;

  @IsNotEmpty()
  @IsUUID()
  assignedToId: string;
}