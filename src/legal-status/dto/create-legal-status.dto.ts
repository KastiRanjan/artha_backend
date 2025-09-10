import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLegalStatusDto {
  @ApiProperty({ description: 'Name of the legal status' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Description of the legal status', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: 'Status of the legal status',
    enum: ['active', 'inactive'],
    default: 'active'
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;
}
