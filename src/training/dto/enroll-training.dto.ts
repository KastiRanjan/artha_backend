import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class EnrollBatchDto {
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class NominateUsersDto {
  @IsNotEmpty()
  @IsArray()
  userIds: string[];

  @IsOptional()
  @IsString()
  remarks?: string;
}
