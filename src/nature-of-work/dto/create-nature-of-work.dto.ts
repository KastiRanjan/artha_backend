import { IsString, Length, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateNatureOfWorkDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 20)
  shortName: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
