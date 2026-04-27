import { PartialType } from '@nestjs/swagger';
import { CreateNatureOfWorkGroupDto } from './create-nature-of-work-group.dto';

export class UpdateNatureOfWorkGroupDto extends PartialType(CreateNatureOfWorkGroupDto) {}
