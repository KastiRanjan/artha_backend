import { IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

const EmptyToUndefined = () =>
  Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value
  );

export class CreateOtherInfoDto {
  @IsString()
  @Length(1, 200)
  particular: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  description?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  attachment?: string;
}

export class UpdateOtherInfoDto extends CreateOtherInfoDto {}
