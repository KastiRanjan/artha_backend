import { Injectable } from '@nestjs/common';
import { CreateTaskGroupDto } from './dto/create-task-group.dto';
import { UpdateTaskGroupDto } from './dto/update-task-group.dto';

@Injectable()
export class TaskGroupsService {
  create(createTaskGroupDto: CreateTaskGroupDto) {
    return 'This action adds a new taskGroup';
  }

  findAll() {
    return `This action returns all taskGroups`;
  }

  findOne(id: number) {
    return `This action returns a #${id} taskGroup`;
  }

  update(id: number, updateTaskGroupDto: UpdateTaskGroupDto) {
    return `This action updates a #${id} taskGroup`;
  }

  remove(id: number) {
    return `This action removes a #${id} taskGroup`;
  }
}
