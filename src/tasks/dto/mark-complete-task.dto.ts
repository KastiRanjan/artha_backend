import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID } from 'class-validator';

export class MarkCompleteTaskDto {
  @ApiProperty({
    description: 'Array of task IDs to mark as complete',
    type: [String],
    example: ['uuid1', 'uuid2']
  })
  @IsArray()
  @IsUUID('all', { each: true })
  taskIds: string[];

  @ApiProperty({
    description: 'ID of the user marking the task(s) as complete',
    type: String,
    example: 'user-uuid'
  })
  @IsString()
  @IsUUID()
  completedBy: string;
}