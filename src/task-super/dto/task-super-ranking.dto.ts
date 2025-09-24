import { IsString, IsInt } from 'class-validator';

export class TaskSuperRankingDto {
  @IsString()
  id: string;

  @IsInt()
  rank: number;
}
