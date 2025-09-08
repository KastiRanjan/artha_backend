import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessSizeDto {
  @ApiProperty({ description: 'Name of the business size', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Short name of the business size', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  shortName: string;

  @ApiPropertyOptional({ description: 'Is business size active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
