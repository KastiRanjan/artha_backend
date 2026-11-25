import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from 'class-validator';

export class CreatePhonebookDto {
  @ApiProperty({ description: 'Contact or label name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ description: 'Primary phone number' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(40)
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Secondary phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  secondaryPhone?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether sharing is enabled', default: true })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @ApiPropertyOptional({ description: 'User IDs to share with', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sharedWithUserIds?: string[];

  @ApiPropertyOptional({ description: 'Role IDs to share with', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sharedWithRoleIds?: string[];
}
