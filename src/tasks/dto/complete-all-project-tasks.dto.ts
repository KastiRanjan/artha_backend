import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class CompleteAllProjectTasksDto {
  @ApiPropertyOptional({
    description: 'Optional list of task IDs to complete. If omitted, all project tasks are completed.',
    type: [String],
    example: ['c6e8d2d1-2c8a-4a7d-b7a7-5f0b3a1f2d44']
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  taskIds?: string[];
}
