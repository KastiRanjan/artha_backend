import { PartialType } from '@nestjs/mapped-types';
import { CreateTodoTaskTitleDto } from './create-todo-task-title.dto';

export class UpdateTodoTaskTitleDto extends PartialType(CreateTodoTaskTitleDto) {}
