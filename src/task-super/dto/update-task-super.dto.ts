import { PartialType } from '@nestjs/swagger';
import { CreateTaskSuperDto } from './create-task-super.dto';

export class UpdateTaskSuperDto extends PartialType(CreateTaskSuperDto) {}