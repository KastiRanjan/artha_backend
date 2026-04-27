import { PartialType } from '@nestjs/swagger';
import { CreateNatureOfWorkDto } from './create-nature-of-work.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateNatureOfWorkDto extends PartialType(CreateNatureOfWorkDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
