import { PartialType } from '@nestjs/swagger';
import { CreateLegalStatusDto } from './create-legal-status.dto';

export class UpdateLegalStatusDto extends PartialType(CreateLegalStatusDto) {}
