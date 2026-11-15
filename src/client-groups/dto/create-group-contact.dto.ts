import { IsString, IsOptional, Length, IsBoolean, IsEmail } from 'class-validator';

export class CreateGroupContactDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsString()
  @Length(1, 100)
  designation: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  department?: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  mobileNo?: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  telephoneNo?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(0, 15)
  extNo?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
