import { PartialType } from '@nestjs/swagger';
import { CreateProjectSignoffDto } from './create-project-signoff.dto';

export class UpdateProjectSignoffDto extends PartialType(CreateProjectSignoffDto) {}
