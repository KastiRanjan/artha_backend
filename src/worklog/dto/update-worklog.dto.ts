import { PartialType } from '@nestjs/swagger';
import { CreateWorklogDto } from './create-worklog.dto';
import { IsOptional, IsDateString, IsString } from 'class-validator';

export class UpdateWorklogDto extends PartialType(CreateWorklogDto) {
	@IsOptional()
	@IsDateString()
	date?: string;
	
	@IsOptional()
	@IsString()
	rejectedRemark?: string;
}
