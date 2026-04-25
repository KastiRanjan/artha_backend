import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class BulkWorklogReviewDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => String)
  worklogIds: string[];

  @IsOptional()
  @IsString()
  rejectedRemark?: string;
}