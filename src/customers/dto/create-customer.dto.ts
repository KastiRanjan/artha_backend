import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length
} from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  @Length(1, 255)
  email: string;

  @IsOptional()
  @IsString()
  @Length(0, 15)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  country?: string;

  @IsOptional()
  @IsString()
  @Length(0, 10)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(0, 10)
  organization?: string;
}
