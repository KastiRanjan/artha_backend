import { IsString, Length, IsOptional, IsNumber } from 'class-validator';

export class CreateNatureOfWorkGroupDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  rank?: number;
}
