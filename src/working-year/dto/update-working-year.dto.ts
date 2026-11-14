import { PartialType } from '@nestjs/swagger';
import { CreateWorkingYearDto } from './create-working-year.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateWorkingYearDto extends PartialType(CreateWorkingYearDto) {
  @IsOptional()
  @IsDateString()
  startDateAD?: string;

  @IsOptional()
  @IsDateString()
  endDateAD?: string;
}
