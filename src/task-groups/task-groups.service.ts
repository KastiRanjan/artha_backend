import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskGroupDto } from './dto/create-task-group.dto';
import { UpdateTaskGroupDto } from './dto/update-task-group.dto';
import { TaskGroup } from './entities/task-group.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from 'src/tasks/entities/task.entity';
import { TaskTemplate } from 'src/task-template/entities/task-template.entity';

@Injectable()
export class TaskGroupsService {
  constructor(
    @InjectRepository(TaskGroup)
    private taskGroupRepository: Repository<TaskGroup>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskTemplate)
    private readonly taskTemplateRepository: Repository<TaskTemplate>
  ) {}

  async create(createTaskGroupDto: CreateTaskGroupDto): Promise<TaskGroup> {
    const { ...taskGroupData } = createTaskGroupDto;

    const taskGroup = this.taskGroupRepository.create(taskGroupData);

    return await this.taskGroupRepository.save(taskGroup);
  }

  findAll() {
    console.log('ok');
    return this.taskGroupRepository.find();
  }

  async findOne(id: string): Promise<TaskGroup> {
    console.log('kkk');
    const taskGroup = await this.taskGroupRepository.findOne({
      where: {
        id
      },
      relations: [
        'tasktemplate', 
        'tasktemplate.parentTask', 
        'tasktemplate.subTasks'
      ]
    });
    
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }
    
    // Organize the task templates properly with parent-child relationships
    if (taskGroup && taskGroup.tasktemplate) {
      // Manually populate subtasks for each story to ensure complete data
      for (const template of taskGroup.tasktemplate) {
        if (template.taskType === 'story') {
          // Get all tasks that have this story as parent
          const subtasks = await this.taskTemplateRepository.find({
            where: { 
              parentTask: { id: template.id }
            },
            relations: ['parentTask']
          });
          template.subTasks = subtasks;
          console.log(`Story "${template.name}" loaded with ${subtasks.length} subtasks`);
        }
      }
      
      console.log('Final taskGroup.tasktemplate:', taskGroup.tasktemplate.map(t => ({
        id: t.id,
        name: t.name,
        taskType: t.taskType,
        hasSubTasks: t.subTasks?.length || 0,
        parentTask: t.parentTask?.name
      })));
    }
    
    return taskGroup;
  }

  async update(
    id: string,
    updateTaskGroupDto: UpdateTaskGroupDto
  ): Promise<TaskGroup> {
    const taskGroup = await this.taskGroupRepository.preload({
      id,
      ...updateTaskGroupDto
    });
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }

    return await this.taskGroupRepository.save(taskGroup);
  }

  async remove(id: string): Promise<void> {
    const taskGroup = await this.taskGroupRepository.findOne(id);
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }

    await this.taskGroupRepository.remove(taskGroup);
  }
}
