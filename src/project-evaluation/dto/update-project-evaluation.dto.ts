import { PartialType } from '@nestjs/swagger';
import { CreateProjectEvaluationDto } from './create-project-evaluation.dto';

export class UpdateProjectEvaluationDto extends PartialType(CreateProjectEvaluationDto) {}
