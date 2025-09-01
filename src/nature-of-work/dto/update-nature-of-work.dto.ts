import { PartialType } from '@nestjs/swagger';
import { CreateNatureOfWorkDto } from './create-nature-of-work.dto';

export class UpdateNatureOfWorkDto extends PartialType(CreateNatureOfWorkDto) {}
