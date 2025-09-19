import { IsArray, IsNotEmpty, IsNumber, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RankingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @IsNumber()
  @IsNotEmpty()
  rank: number;
}

export class UpdateTaskRankingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RankingDto)
  rankings: RankingDto[];
}