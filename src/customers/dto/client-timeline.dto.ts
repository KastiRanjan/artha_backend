import { IsBoolean, IsDateString, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

const EmptyToUndefined = () =>
  Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value
  );

export class CreateClientTimelineDto {
  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(1, 80)
  eventType?: string;

  @IsString()
  @Length(1, 180)
  title: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  details?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsBoolean()
  isManual?: boolean;
}
