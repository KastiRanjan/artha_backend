import { IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateUsersDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  status: string;

  @IsInt()
  role: number;

  @IsOptional()
  personal?: Record<string, any>;

  @IsOptional()
  education?: Record<string, any>;

  @IsOptional()
  bank?: Record<string, any>;

  @IsOptional()
  contract?: Record<string, any>;

  @IsOptional()
  training?: Record<string, any>;
}
