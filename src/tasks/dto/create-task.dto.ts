import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  assineeId?: string[];

  @IsOptional()
  @Type(() => String)
  projectId?: string;

  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @IsOptional()
  @Type(() => Date)
  group?: string;

  @IsOptional()
  @Type(() => String)
  parentTaskId?: string;
}
