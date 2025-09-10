import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreatePortalCredentialDto {
  @ApiProperty({ description: 'Name of the portal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  portalName: string;

  @ApiProperty({ description: 'Login username' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  loginUser: string;

  @ApiProperty({ description: 'Login password' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password: string;

  @ApiProperty({ description: 'Portal website URL', required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: 'Optional description', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ 
    description: 'Status of the credential', 
    enum: ['active', 'inactive'],
    default: 'active'
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;
}

export class UpdatePortalCredentialDto extends CreatePortalCredentialDto {}
