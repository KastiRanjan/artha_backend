import { Injectable, NotFoundException } from '@nestjs/common';
import { ConflictException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { In } from 'typeorm'; // Add this import
import { BulkUpdateTaskDto } from './dto/bulk-update-task.dto';


@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(TaskGroup)
    private taskGroupRepository: Repository<TaskGroup>
  ) {}

  private async generateTaskCode(projectId: string): Promise<string> {
    const latestTask = await this.taskRepository.findOne({
      where: { project: { id: projectId } },
      order: { tcode: 'DESC' }
    });
    const newCode = !latestTask ? 1 : parseInt(latestTask.tcode) + 1;
    return newCode.toString();
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { name, description, projectId, parentTaskId, groupId, dueDate, assineeId } = createTaskDto;

    // Check for existing task with the same name in the project
    const existingTask = await this.taskRepository.findOne({
      where: {
        name,
        project: { id: projectId },
      },
    });

    if (existingTask) {
      throw new ConflictException({
        message: `Task name "${name}" already exists in project`,
        errors: [{
          field: 'name',
          message: 'Task name must be unique within the project'
        }]
      });
    }

    // Create a new task instance
    const task = this.taskRepository.create({
      name,
      tcode: await this.generateTaskCode(projectId),
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      group: groupId ? await this.taskGroupRepository.findOne({ where: { id: groupId } }) : null,
      project: await this.projectRepository.findOne({ where: { id: projectId } }),
      parentTask: parentTaskId ? await this.taskRepository.findOne({ where: { id: parentTaskId } }) : null,
      assignees: assineeId ? await this.userRepository.find({ where: { id: In(assineeId) } }) : [],
    });

    // Save the task to the database
    return await this.taskRepository.save(task);
  }
  async addBulk(importTaskDto: any): Promise<any> {
    const { project, tasks } = importTaskDto;
    const projectEntity = await this.projectRepository.findOne(project);

    const savedTasks = await Promise.all(
      tasks.map(async (task) => {
        const taskGroup = await this.taskGroupRepository.findOne({
          where: {
            id: task
          },
          relations: [
            'tasktemplate',
            'tasktemplate.parentTask',
            'tasktemplate.subTasks'
          ]
        });

        if (!taskGroup) {
          throw new NotFoundException(
            `Task Group with ID ${task.id} not found`
          );
        }
        if (taskGroup && taskGroup.tasktemplate) {
          taskGroup.tasktemplate = taskGroup.tasktemplate.filter(
            (template) => template.parentTask === null
          );
        }

        const newTasks = await Promise.all(
          taskGroup.tasktemplate.map(async (template) => {
            const existingTask = await this.taskRepository.findOne({
              where: {
                name: template.name,
                project: projectEntity
              }
            });
            if (!existingTask) {
              const newTask = await this.taskRepository.save(
                this.taskRepository.create({
                  name: template.name,
                  tcode: await this.generateTaskCode(project),
                  description: template.description,
                  taskType: template.taskType,
                  project: projectEntity,
                  parentTask: template.parentTask,
                  group: taskGroup
                })
              );
              if (!isEmpty(template.subTasks)) {
                template.subTasks.map(async (subTaskTemplate) => {
                  const subTasks = await this.taskRepository.create({
                    name: subTaskTemplate.name,
                    tcode: await this.generateTaskCode(project),
                    description: subTaskTemplate.description,
                    taskType: subTaskTemplate.taskType,
                    project: projectEntity,
                    parentTask: newTask,
                    group: taskGroup
                  });
                  await this.taskRepository.save(subTasks);
                });
              }
              return newTask;
            } else {
              return null;
            }
          })
        );

        return newTasks.filter((task) => task !== null);
      })
    );

    return {
      project,
      tasks: savedTasks,
      message: 'Successfully added tasks to project'
    };

    // const savedTasks = await Promise.all(
    //   importTaskDto.tasks.map(async (task) => {
    //     const newTask = this.taskRepository.create({
    //       name: task.name,
    //       tcode: await this.generateTaskCode(importTaskDto.project),
    //       description: task.description,
    //       project: await this.projectRepository.findOne(importTaskDto.project),
    //     });
    //     return this.taskRepository.save(newTask);
    //   })
    // );
    // return {
    //   project: importTaskDto.project,
    //   tasks: savedTasks,
    //   message: 'Successfully added tasks to project',
    // };
  }

  async addBulkList(importTaskTemplateDto: any): Promise<any> {
    const { project, tasks, tasklist } = importTaskTemplateDto;
  
    // Validate project exists
    const projectEntity = await this.projectRepository.findOne({
      where: { id: project }
    });
    if (!projectEntity) {
      throw new NotFoundException(`Project with ID ${project} not found`);
    }
  
    // Validate task groups (tasks field contains task group IDs)
    const taskGroups = await this.taskGroupRepository.find({
      where: { id: In(tasks) }, // Use In operator for array of IDs
      relations: ['tasktemplate', 'tasktemplate.parentTask']
    });
  
    if (!taskGroups.length) {
      throw new NotFoundException(`No valid task groups found for IDs: ${tasks}`);
    }
  
    // Filter task templates based on tasklist (tasklist contains template IDs)
    const templatesToProcess = taskGroups
      .flatMap(group => group.tasktemplate || [])
      .filter(template => tasklist.includes(template.id));
  
    if (!templatesToProcess.length) {
      throw new NotFoundException(`No matching task templates found for IDs: ${tasklist}`);
    }
  
    // Process and create tasks from templates
    const savedTasks = await Promise.all(
      templatesToProcess.map(async (template) => {
        // Check if task already exists
        const existingTask = await this.taskRepository.findOne({
          where: {
            name: template.name,
            project: projectEntity
          }
        });
  
        if (existingTask) {
          return null; // Skip existing tasks
        }
  
        // Find the task group for this template
        const taskGroup = taskGroups.find(group => 
          group.tasktemplate.some(t => t.id === template.id)
        );
  
        // Create new task from template
        const newTask = this.taskRepository.create({
          name: template.name,
          tcode: await this.generateTaskCode(project),
          description: template.description || '',
          project: projectEntity,
          status: 'open',
          group: taskGroup,
          assignees: [],
          parentTask: template.parentTask
            ? await this.taskRepository.findOne({ where: { id: template.parentTask.id } })
            : null
        });
  
        return await this.taskRepository.save(newTask);
      })
    );
  
    // Filter out null values (skipped tasks) and return response
    const successfulTasks = savedTasks.filter(task => task !== null);
  
    return {
      project: projectEntity.id,
      tasks: successfulTasks,
      message: `Successfully added ${successfulTasks.length} tasks to project from ${templatesToProcess.length} templates`
    };
  }

  findAll(status: 'open' | 'in_progress' | 'done') {
    return this.taskRepository.find({
      where: { status },
      relations: ['worklogs', 'project', 'assignees', 'group', 'subTasks']
    });
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
    task.dueDate = updateTaskDto.dueDate
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


  async bulkUpdate(bulkUpdateTaskDto: BulkUpdateTaskDto): Promise<any> {
    console.log(bulkUpdateTaskDto);
    const { taskIds, dueDate, assigneeIds } = bulkUpdateTaskDto;

    const tasks = await this.taskRepository.find({
      where: { id: In(taskIds) },
      relations: ['assignees'],
    });

    if (tasks.length !== taskIds.length) {
      throw new NotFoundException('One or more tasks not found');
    }

    const updatedTasks = await Promise.all(
      tasks.map(async (task) => {
        if (dueDate) {
          task.dueDate = new Date(dueDate);
        }
        if (assigneeIds) {
          task.assignees = await this.userRepository.find({
            where: { id: In(assigneeIds) },
          });
        }
        return this.taskRepository.save(task);
      })
    );

    return updatedTasks;
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id); // Ensures task exists
    await this.taskRepository.remove(task); // Remove the task
  }
}
