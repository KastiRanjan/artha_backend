import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class CompleteProjectDto {
  @ApiProperty({
    enum: ['completed'],
    description: 'Status must be completed'
  })
  @IsNotEmpty()
  @IsEnum(['completed'])
  status: 'completed';
}
