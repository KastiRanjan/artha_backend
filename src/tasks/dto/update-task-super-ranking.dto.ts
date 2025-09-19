import { IsArray, IsNotEmpty, IsNumber, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TaskSuperRankingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  taskSuperProjectId: string;

  @IsNumber()
  @IsNotEmpty()
  rank: number;
}

export class UpdateTaskSuperRankingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskSuperRankingDto)
  rankings: TaskSuperRankingDto[];
}