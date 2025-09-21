import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TodoTaskStatus } from '../entities/todo-task.entity';

export class UpdateTodoTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  taskTypeId?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  acknowledgeRemark?: string;

  @IsOptional()
  @IsString()
  completionRemark?: string;

  @IsOptional()
  @IsString()
  pendingRemark?: string;

  @IsOptional()
  @IsString()
  droppedRemark?: string;

  @IsOptional()
  @IsEnum(TodoTaskStatus)
  status?: TodoTaskStatus;
}