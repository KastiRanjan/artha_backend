import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';

export class CreateWorklogDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  endTime?: Date;

  @IsOptional()
  @Type(() => String)
  userId: string;

  @IsOptional()
  @Type(() => String)
  approvedBy: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  status: 'open' | 'approved' | 'rejected' | 'pending' | 'requested';

  @IsNotEmpty()
  @Type(() => String)
  taskId: string;

  @IsOptional()
  @Type(() => String)
  projectId?: string;

}


export class CreateWorklogListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorklogDto) // Transform each item in the array to CreateWorklogDto
  worklogs: CreateWorklogDto[];

  @IsNotEmpty()
  @Type(() => Boolean)
  approvalRequest: boolean;
}