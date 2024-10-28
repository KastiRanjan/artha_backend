import { IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateUsersDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  status: string;

  @IsString()
  role: string;

  @IsOptional()
  personal?: Record<string, any>;

  @IsOptional()
  document?: Record<string, any>;

  @IsOptional()
  education?: Record<string, any>;

  @IsOptional()
  bank?: Record<string, any>;

  @IsOptional()
  contract?: Record<string, any>;

  @IsOptional()
  training?: Record<string, any>;
}
