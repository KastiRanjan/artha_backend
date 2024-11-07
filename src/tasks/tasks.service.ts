import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';
import { ImportTaskDto } from './dto/import-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(TaskGroup)
    private taskGroupRepository: Repository<TaskGroup>
  ) { }

  private async generateTaskCode(projectId: string): Promise<string> {
    const latestTask = await this.taskRepository.findOne({
      where: { project: { id: projectId } },
      order: { tcode: 'DESC' }
    });
    const newCode = !latestTask ? 1 : parseInt(latestTask.tcode) + 1;
    return newCode.toString();
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { name, description, projectId, parentTaskId } = createTaskDto;

    // Create a new task instance
    const task = this.taskRepository.create({
      name,
      tcode: await this.generateTaskCode(projectId),
      description,
      project: projectId
        ? await this.projectRepository.findOne(projectId)
        : null,
      parentTask: parentTaskId
        ? await this.taskRepository.findOne({ where: { id: parentTaskId } })
        : null,
      assignees: createTaskDto.assineeId
        ? await this.userRepository.findByIds(createTaskDto.assineeId)
        : []
    });
    // Save the task to the database
    return await this.taskRepository.save(task);
  }
  async addBulk(importTaskDto: ImportTaskDto): Promise<any> {
    const savedTasks = await Promise.all(
      importTaskDto.tasks.map(async (task) => {
        const newTask = this.taskRepository.create({
          name: task.name,
          tcode: await this.generateTaskCode(importTaskDto.project),
          description: task.description,
          project: await this.projectRepository.findOne(importTaskDto.project),
        });
        return this.taskRepository.save(newTask);
      })
    );
    return {
      project: importTaskDto.project,
      tasks: savedTasks,
      message: 'Successfully added tasks to project',
    };
  }

  findAll() {
    return this.taskRepository.find({ relations: ['worklogs', 'project', 'assignees', 'group', 'subTasks'] });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id }
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }
  async findOneByProjectId(id: string) {
    const task = await this.taskRepository.find({
      where: { project: { id: id } },
      relations: ['assignees', 'group', 'subTasks', 'project']
    });
    if (!task) {
      throw new NotFoundException(`Task with project ID ${id} not found`);
    }
    return task;
  }
  async findOneByProjectIdAndTaskId(projectId: string, taskId: string) {
    const task = await this.taskRepository.findOne({
      where: { project: { id: projectId }, id: taskId },
      relations: ['assignees', 'group', 'subTasks', 'project']
    });
    if (!task) {
      throw new NotFoundException(
        `Task with project ID ${projectId} and task ID ${taskId} not found`
      );
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id); // Ensures task exists

    // Update properties if provided
    task.name = updateTaskDto.name ?? task.name;
    task.status = updateTaskDto.status ?? task.status;
    task.description = updateTaskDto.description ?? task.description;
    task.parentTask = updateTaskDto.parentTaskId
      ? await this.taskRepository.findOne({
        where: { id: updateTaskDto.parentTaskId }
      })
      : task.parentTask;
    task.assignees = updateTaskDto.assineeId
      ? await this.userRepository.findByIds(updateTaskDto.assineeId)
      : [];

    // Save updated task to the database
    return await this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id); // Ensures task exists
    await this.taskRepository.remove(task); // Remove the task
  }
}
