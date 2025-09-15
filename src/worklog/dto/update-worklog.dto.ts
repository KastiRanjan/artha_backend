import { PartialType } from '@nestjs/swagger';
import { CreateWorklogDto } from './create-worklog.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateWorklogDto extends PartialType(CreateWorklogDto) {
	@IsOptional()
	@IsDateString()
	date?: string;
}
