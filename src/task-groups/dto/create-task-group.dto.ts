import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
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
  tasksId?: number[]; // Assuming you want to reference related tasks
}
