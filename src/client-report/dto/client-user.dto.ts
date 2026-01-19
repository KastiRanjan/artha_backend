import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  MinLength,
  IsArray
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientUserStatus } from '../entities/client-user.entity';

export class CreateClientUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Array of customer IDs this user can access' })
  @IsArray()
  @IsUUID('4', { each: true })
  customerIds: string[];
}

export class UpdateClientUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ClientUserStatus)
  status?: ClientUserStatus;

  @ApiPropertyOptional({ description: 'Array of customer IDs this user can access' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  customerIds?: string[];
}

export class ClientLoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Optional: Select a specific customer to access' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class SelectCustomerDto {
  @ApiProperty({ description: 'Customer ID to switch to' })
  @IsUUID()
  customerId: string;
}

export class ClientResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class ClientForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class ClientChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
