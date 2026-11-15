import { IsString, IsOptional, Length, IsEnum, IsUUID } from 'class-validator';

export class CreateClientGroupDto {
  @IsString()
  @Length(2, 150)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(0, 150)
  primaryContactPerson?: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  primaryPhone?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  primaryEmail?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  headOfficeAddress?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsUUID()
  partnerInChargeId?: string;
}
