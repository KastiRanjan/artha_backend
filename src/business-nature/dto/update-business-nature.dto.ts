import { PartialType } from '@nestjs/swagger';
import { CreateBusinessNatureDto } from './create-business-nature.dto';

export class UpdateBusinessNatureDto extends PartialType(CreateBusinessNatureDto) {}
