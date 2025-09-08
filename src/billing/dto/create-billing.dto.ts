import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBillingDto {
  @ApiProperty({ description: 'Name of the billing entity' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Short name of the billing entity (for use in project naming)' })
  @IsString()
  @MaxLength(20)
  shortName: string;

  @ApiProperty({ description: 'Registration number', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  registration_number?: string;

  @ApiProperty({ description: 'PAN number', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  pan_number?: string;

  @ApiProperty({ description: 'VAT number', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  vat_number?: string;

  @ApiProperty({ description: 'Address', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;

  @ApiProperty({ description: 'Email address', required: false })
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: 'Logo URL', required: false })
  @IsString()
  @IsOptional()
  logo_url?: string;

  @ApiProperty({ description: 'Bank account name', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  bank_account_name?: string;

  @ApiProperty({ description: 'Bank name', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  bank_name?: string;

  @ApiProperty({ description: 'Bank account number', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  bank_account_number?: string;

  @ApiProperty({ description: 'Status', enum: ['active', 'suspended', 'archived'], default: 'active', required: false })
  @IsEnum(['active', 'suspended', 'archived'])
  @IsOptional()
  status?: 'active' | 'suspended' | 'archived';
}
