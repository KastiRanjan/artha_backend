import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePhonebookCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string;
}
