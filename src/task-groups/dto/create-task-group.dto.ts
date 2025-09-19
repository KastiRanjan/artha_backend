import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTaskDto } from 'src/tasks/dto/create-task.dto';

export class CreateTaskGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  rank?: number;

  @IsOptional()
  @IsString()
  @IsUUID()
  taskSuperId?: string;
}
