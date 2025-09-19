import { IsArray, IsNotEmpty, IsNumber, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TaskGroupRankingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  taskGroupProjectId: string;

  @IsNumber()
  @IsNotEmpty()
  rank: number;
}

export class UpdateTaskGroupRankingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskGroupRankingDto)
  rankings: TaskGroupRankingDto[];
}