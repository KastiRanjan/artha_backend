import { Injectable, NotFoundException } from '@nestjs/common';
import { ConflictException, BadRequestException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { ProjectTimelineService } from 'src/projects/project-timeline.service';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';
import { Worklog } from 'src/worklog/entities/worklog.entity';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MarkCompleteTaskDto } from './dto/mark-complete-task.dto';
import { FirstVerifyTaskDto } from './dto/first-verify-task.dto';
import { SecondVerifyTaskDto } from './dto/second-verify-task.dto';
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
    private taskGroupRepository: Repository<TaskGroup>,
    @InjectRepository(Worklog)
    private worklogRepository: Repository<Worklog>,
    private readonly projectTimelineService: ProjectTimelineService
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

    // Get project with worklog settings
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    let finalAssignees = assineeId ? await this.userRepository.find({ where: { id: In(assineeId) } }) : [];

    // If this is a subtask and project doesn't allow subtask worklog, inherit parent's assignees
    let parentTask = null;
    if (parentTaskId) {
      parentTask = await this.taskRepository.findOne({ 
        where: { id: parentTaskId },
        relations: ['assignees']
      });
      
      if (parentTask && !project.allowSubtaskWorklog) {
        // Auto-assign parent task assignees to subtask when subtask worklog is disabled
        const parentAssignees = parentTask.assignees || [];
        const combinedAssigneeIds = new Set([
          ...finalAssignees.map(a => a.id),
          ...parentAssignees.map(a => a.id)
        ]);
        finalAssignees = await this.userRepository.find({ 
          where: { id: In(Array.from(combinedAssigneeIds)) } 
        });
      }
    }

    // Create a new task instance
    const task = this.taskRepository.create({
      name,
      tcode: await this.generateTaskCode(projectId),
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      group: groupId ? await this.taskGroupRepository.findOne({ where: { id: groupId } }) : null,
      project,
      parentTask,
      assignees: finalAssignees,
    });

    // Save the task to the database
    const savedTask = await this.taskRepository.save(task);
    // Ensure project relation is loaded
    let taskWithProject = savedTask;
    if (!taskWithProject.project) {
      taskWithProject = await this.taskRepository.findOne({
        where: { id: savedTask.id },
        relations: ['project']
      });
    }
    // Log task addition in project timeline
    await this.projectTimelineService.log({
      projectId: taskWithProject.project.id,
      userId: null,
      action: 'task_added',
      details: `Task '${name}' added to project.`
    });
    return savedTask;
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
                // Process subtasks sequentially to ensure proper creation
                await Promise.all(
                  template.subTasks.map(async (subTaskTemplate) => {
                    const existingSubTask = await this.taskRepository.findOne({
                      where: {
                        name: subTaskTemplate.name,
                        project: projectEntity
                      }
                    });
                    
                    if (!existingSubTask) {
                      const subTask = this.taskRepository.create({
                        name: subTaskTemplate.name,
                        tcode: await this.generateTaskCode(project),
                        description: subTaskTemplate.description,
                        taskType: subTaskTemplate.taskType,
                        project: projectEntity,
                        parentTask: newTask,
                        group: taskGroup
                      });
                      return await this.taskRepository.save(subTask);
                    }
                    return null;
                  })
                );
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
      relations: ['tasktemplate', 'tasktemplate.parentTask', 'tasktemplate.subTasks']
    });
  
    if (!taskGroups.length) {
      throw new NotFoundException(`No valid task groups found for IDs: ${tasks}`);
    }
  
    // Parse tasklist to extract individual template IDs and determine explicit selections
    // Frontend sends compound IDs like "parentId-childId" for children and simple IDs for standalone/parents
    const parseTaskList = (tasklist: string[]): { 
      individualTemplateIds: string[], 
      explicitParents: Set<string>, 
      explicitChildren: Set<string>,
      compoundSelections: Map<string, string[]> // parentId -> [childId1, childId2, ...]
    } => {
      const templateIds = new Set<string>();
      const explicitParents = new Set<string>();
      const explicitChildren = new Set<string>();
      const compoundSelections = new Map<string, string[]>();
      
      tasklist.forEach(item => {
        // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12 characters)
        // Compound format: parentUUID-childUUID
        // We need to split at the correct position - after the first complete UUID
        const uuidPattern = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
        const match = item.match(uuidPattern);
        
        if (match) {
          // This is a compound ID: parentId-childId
          const [, parentId, childId] = match;
          templateIds.add(parentId);
          templateIds.add(childId);
          explicitChildren.add(childId);
          
          // Track compound selections
          if (!compoundSelections.has(parentId)) {
            compoundSelections.set(parentId, []);
          }
          compoundSelections.get(parentId)!.push(childId);
        } else {
          // This is a simple template ID (explicitly selected parent or standalone)
          templateIds.add(item);
          explicitParents.add(item);
        }
      });
      
      return { 
        individualTemplateIds: Array.from(templateIds), 
        explicitParents, 
        explicitChildren,
        compoundSelections
      };
    };
    
    const { individualTemplateIds, explicitParents, explicitChildren, compoundSelections } = parseTaskList(tasklist);
    
    // Debug logging
    console.log('=== Debug Task List Parsing ===');
    console.log('Original tasklist:', tasklist);
    console.log('Individual template IDs:', individualTemplateIds);
    console.log('Explicit parents:', Array.from(explicitParents));
    console.log('Explicit children:', Array.from(explicitChildren));
    console.log('Compound selections:', Object.fromEntries(compoundSelections));
    
    // Filter task templates based on parsed template IDs
    const templatesToProcess = taskGroups
      .flatMap(group => group.tasktemplate || [])
      .filter(template => individualTemplateIds.includes(template.id));
  
    if (!templatesToProcess.length) {
      throw new NotFoundException(`No matching task templates found for IDs: ${individualTemplateIds}`);
    }

    // Separate parent and child templates
    // Include parents that are explicitly selected OR part of compound selections
    const parentTemplates = templatesToProcess.filter(t => 
      !t.parentTask && (explicitParents.has(t.id) || compoundSelections.has(t.id))
    );
    const childTemplates = templatesToProcess.filter(t => t.parentTask);
    
    // Debug logging
    console.log('=== Debug Template Processing ===');
    console.log('Templates to process:', templatesToProcess.map(t => ({ id: t.id, name: t.name, taskType: t.taskType, hasParent: !!t.parentTask })));
    console.log('Parent templates:', parentTemplates.map(t => ({ id: t.id, name: t.name })));
    console.log('Child templates:', childTemplates.map(t => ({ id: t.id, name: t.name, parentId: t.parentTask?.id })));
    
    // Create a map to track created parent tasks
    const createdParentTasks = new Map();
    const allSuccessfulTasks = [];
  
    // Process parent templates first
    for (const template of parentTemplates) {
      // Check if task already exists in project
      const existingTask = await this.taskRepository.findOne({
        where: {
          name: template.name,
          project: projectEntity
        }
      });

      if (existingTask) {
        createdParentTasks.set(template.id, existingTask);
        continue; // Skip existing tasks
      }

      // Find the task group for this template
      const taskGroup = taskGroups.find(group => 
        group.tasktemplate.some(t => t.id === template.id)
      );

      // Create new parent task from template
      const newTask = this.taskRepository.create({
        name: template.name,
        tcode: await this.generateTaskCode(project),
        description: template.description || '',
        taskType: template.taskType,
        project: projectEntity,
        status: 'open',
        group: taskGroup,
        assignees: [],
        parentTask: null
      });

      const savedTask = await this.taskRepository.save(newTask);
      createdParentTasks.set(template.id, savedTask);
      allSuccessfulTasks.push(savedTask);
    }

    // Process child templates - only if parent wasn't explicitly selected
    // Track which child tasks we've created to avoid duplicates later
    const createdChildTasks = new Set<string>();
    
    for (const template of childTemplates) {
      // Skip children that are part of compound selections - they'll be handled by parent processing
      const isPartOfCompoundSelection = Array.from(compoundSelections.values())
        .flat()
        .includes(template.id);
      
      if (isPartOfCompoundSelection) {
        // Add to createdChildTasks to track that this will be handled by parent processing
        createdChildTasks.add(template.id);
        continue; // Skip this child as it will be handled by parent processing
      }

      // Check if task already exists in project
      const existingTask = await this.taskRepository.findOne({
        where: {
          name: template.name,
          project: projectEntity
        }
      });

      if (existingTask) {
        continue; // Skip existing tasks
      }

      // Find parent task - either from created tasks or existing in project
      let parentTask = createdParentTasks.get(template.parentTask.id);
      
      if (!parentTask) {
        // Look for existing parent task in project
        parentTask = await this.taskRepository.findOne({
          where: {
            name: template.parentTask.name,
            project: projectEntity,
            taskType: 'story'
          }
        });
      }

      // If parent still doesn't exist, create it first
      if (!parentTask) {
        const parentTemplate = template.parentTask;
        const taskGroup = taskGroups.find(group => 
          group.tasktemplate.some(t => t.id === parentTemplate.id)
        );

        const newParentTask = this.taskRepository.create({
          name: parentTemplate.name,
          tcode: await this.generateTaskCode(project),
          description: parentTemplate.description || '',
          taskType: parentTemplate.taskType,
          project: projectEntity,
          status: 'open',
          group: taskGroup,
          assignees: [],
          parentTask: null
        });

        parentTask = await this.taskRepository.save(newParentTask);
        createdParentTasks.set(parentTemplate.id, parentTask);
        allSuccessfulTasks.push(parentTask);
      }

      // Find the task group for this template
      const taskGroup = taskGroups.find(group => 
        group.tasktemplate.some(t => t.id === template.id)
      );

      // Create new child task from template
      const newTask = this.taskRepository.create({
        name: template.name,
        tcode: await this.generateTaskCode(project),
        description: template.description || '',
        taskType: template.taskType,
        project: projectEntity,
        status: 'open',
        group: taskGroup,
        assignees: !projectEntity.allowSubtaskWorklog ? parentTask.assignees || [] : [],
        parentTask: parentTask
      });

      const savedTask = await this.taskRepository.save(newTask);
      createdChildTasks.add(template.id);
      allSuccessfulTasks.push(savedTask);
    }

    // Now process subtasks for explicitly selected parent tasks
    for (const parentTemplate of parentTemplates) {
      const parentTask = createdParentTasks.get(parentTemplate.id);
      if (!parentTask) continue;

      // Get all subtasks for this parent from the template
      const parentTemplateWithSubtasks = taskGroups
        .flatMap(group => group.tasktemplate || [])
        .find(t => t.id === parentTemplate.id);

      if (parentTemplateWithSubtasks && parentTemplateWithSubtasks.subTasks) {
        for (const subTaskTemplate of parentTemplateWithSubtasks.subTasks) {
          // Check if this subtask was explicitly selected via compound selection
          const parentCompoundChildren = compoundSelections.get(parentTemplate.id) || [];
          const wasExplicitlySelected = explicitChildren.has(subTaskTemplate.id) && 
                                       parentCompoundChildren.includes(subTaskTemplate.id);
          
          // Only process if it was explicitly selected as part of a compound selection
          if (!wasExplicitlySelected) {
            continue;
          }

          // Check if subtask already exists
          const existingSubTask = await this.taskRepository.findOne({
            where: {
              name: subTaskTemplate.name,
              project: projectEntity,
              parentTask: parentTask
            }
          });

          if (existingSubTask) {
            continue; // Skip existing subtasks
          }

          // Find the task group for this subtask template
          const taskGroup = taskGroups.find(group => 
            group.tasktemplate.some(t => t.id === subTaskTemplate.id)
          );

          // Create subtask
          const newSubTask = this.taskRepository.create({
            name: subTaskTemplate.name,
            tcode: await this.generateTaskCode(project),
            description: subTaskTemplate.description || '',
            taskType: subTaskTemplate.taskType,
            project: projectEntity,
            status: 'open',
            group: taskGroup,
            assignees: !projectEntity.allowSubtaskWorklog ? parentTask.assignees || [] : [],
            parentTask: parentTask
          });

          const savedSubTask = await this.taskRepository.save(newSubTask);
          allSuccessfulTasks.push(savedSubTask);
        }
      }
    }
  
    return {
      project: projectEntity.id,
      tasks: allSuccessfulTasks,
      message: `Successfully added ${allSuccessfulTasks.length} tasks to project from ${templatesToProcess.length} templates`
    };
  }

  findAll(status: 'open' | 'in_progress' | 'done') {
    return this.taskRepository.find({
      where: { status },
      relations: [
        'worklogs', 
        'project', 
        'assignees', 
        'group', 
        'subTasks',
        'subTasks.assignees',
        'subTasks.group',
        'parentTask',
        'parentTask.assignees',
        'parentTask.group'
      ]
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
    const tasks = await this.taskRepository.find({
      where: { project: { id: id } },
      relations: [
        'assignees', 
        'group', 
        'project', 
        'parentTask'
      ]
    });
    
    if (!tasks) {
      throw new NotFoundException(`Task with project ID ${id} not found`);
    }

    // Manually populate subTasks for each parent task
    const tasksWithSubTasks = await Promise.all(
      tasks.map(async (task) => {
        if (task.taskType === 'story') {
          // Find all subtasks that have this task as parent and belong to the same project
          const subTasks = await this.taskRepository.find({
            where: { 
              parentTask: { id: task.id },
              project: { id: id }
            },
            relations: ['assignees', 'group', 'project']
          });
          
          return {
            ...task,
            subTasks: subTasks
          };
        }
        return task;
      })
    );

    return tasksWithSubTasks;
  }
  async findOneByProjectIdAndTaskId(projectId: string, taskId: string) {
    const task = await this.taskRepository.findOne({
      where: { project: { id: projectId }, id: taskId },
      relations: [
        'assignees', 
        'group', 
        'subTasks',
        'subTasks.assignees',
        'subTasks.group',
        'project', 
        'parentTask',
        'parentTask.assignees',
        'parentTask.group'
      ]
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
    task.first = updateTaskDto.first !== undefined ? updateTaskDto.first : task.first;
    task.last = updateTaskDto.last !== undefined ? updateTaskDto.last : task.last;
    task.group = updateTaskDto.groupId
    ? await this.taskGroupRepository.findOne({ where: { id: updateTaskDto.groupId } })
    : task.group;
    task.parentTask = updateTaskDto.parentTaskId
      ? await this.taskRepository.findOne({
          where: { id: updateTaskDto.parentTaskId }
        })
      : task.parentTask;
    // Track previous assignees for logging
    const prevAssigneeIds = (task.assignees || []).map(u => u.id);
    const newAssignees = updateTaskDto.assineeId
      ? await this.userRepository.findByIds(updateTaskDto.assineeId)
      : [];
    task.assignees = newAssignees;

    // Save updated task to the database
    const updatedTask = await this.taskRepository.save(task);

    // Log assignment changes in project timeline
    const added = (newAssignees || []).filter(u => !prevAssigneeIds.includes(u.id));
    const removed = (task.assignees || []).filter(u => !updateTaskDto.assineeId?.includes(u.id));
    // Ensure project relation is loaded
    let taskWithProject = task;
    if (!taskWithProject.project) {
      taskWithProject = await this.taskRepository.findOne({
        where: { id: task.id },
        relations: ['project']
      });
    }
    for (const user of added) {
      await this.projectTimelineService.log({
        projectId: taskWithProject.project.id,
        userId: user.id,
        action: 'task_assigned',
        details: `User '${user.name}' assigned to task '${taskWithProject.name}'.`
      });
    }
    for (const user of removed) {
      await this.projectTimelineService.log({
        projectId: taskWithProject.project.id,
        userId: user.id,
        action: 'task_unassigned',
        details: `User '${user.name}' unassigned from task '${taskWithProject.name}'.`
      });
    }
    return updatedTask;
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

  async remove(id: string): Promise<{ message: string; taskId: string; projectId?: string }> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['project']
    });
    
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    const projectId = task.project?.id;
    const taskName = task.name;
    
    // Remove the task
    await this.taskRepository.remove(task);
    
    // Log task deletion in project timeline if project exists
    if (projectId) {
      await this.projectTimelineService.log({
        projectId: projectId,
        userId: null,
        action: 'task_deleted',
        details: `Task '${taskName}' was deleted from project.`
      });
    }
    
    return {
      message: 'Task deleted successfully',
      taskId: id,
      projectId: projectId
    };
  }

  async markTasksComplete(markCompleteTaskDto: MarkCompleteTaskDto): Promise<any> {
    const { taskIds, completedBy } = markCompleteTaskDto;

    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: completedBy } });
    if (!user) {
      throw new NotFoundException(`User with ID ${completedBy} not found`);
    }

    // Get all tasks with their relations including project settings
    const tasks = await this.taskRepository.find({
      where: { id: In(taskIds) },
      relations: ['worklogs', 'subTasks', 'parentTask', 'project'],
    });

    if (tasks.length !== taskIds.length) {
      throw new NotFoundException('One or more tasks not found');
    }

    const results = [];
    const errors = [];

    for (const task of tasks) {
      try {
        // Get project to check allowSubtaskWorklog setting
        const project = task.project;
        if (!project) {
          errors.push({
            taskId: task.id,
            taskName: task.name,
            error: 'Task has no associated project'
          });
          continue;
        }

        // Validation logic based on task type and project settings
        if (task.taskType === 'story') {
          // For story tasks (main tasks), always check if all subtasks are complete
          if (task.subTasks && task.subTasks.length > 0) {
            const incompleteSubtasks = task.subTasks.filter(subtask => subtask.status !== 'done');
            if (incompleteSubtasks.length > 0) {
              errors.push({
                taskId: task.id,
                taskName: task.name,
                error: `Cannot complete story: ${incompleteSubtasks.length} subtask(s) are not complete`,
                incompleteSubtasks: incompleteSubtasks.map(st => ({ id: st.id, name: st.name }))
              });
              continue;
            }
          }

          // For story tasks, always check worklog requirement
          const hasWorklogs = task.worklogs && task.worklogs.length > 0;
          if (!hasWorklogs) {
            errors.push({
              taskId: task.id,
              taskName: task.name,
              error: 'Story task must have worklogs to be marked complete'
            });
            continue;
          }
        } else if (task.taskType === 'task') {
          // For subtasks, validation depends on project allowSubtaskWorklog setting
          if (project.allowSubtaskWorklog) {
            // If project allows subtask worklog, subtask must have worklogs
            const hasWorklogs = task.worklogs && task.worklogs.length > 0;
            if (!hasWorklogs) {
              errors.push({
                taskId: task.id,
                taskName: task.name,
                error: 'Subtask must have worklogs to be marked complete (project allows subtask worklog)'
              });
              continue;
            }
          } else {
            // If project doesn't allow subtask worklog, just check if it's in progress
            // (indicating parent task has worklogs and work has been done)
            if (task.status !== 'in_progress') {
              errors.push({
                taskId: task.id,
                taskName: task.name,
                error: 'Subtask must be in progress to be marked complete'
              });
              continue;
            }
          }
        }

        // Additional check: ensure task is in progress (has been worked on)
        if (task.status !== 'in_progress') {
          // Auto-update to in_progress if has worklogs but not in progress status
          const hasWorklogs = task.worklogs && task.worklogs.length > 0;
          if (hasWorklogs) {
            task.status = 'in_progress';
          } else {
            errors.push({
              taskId: task.id,
              taskName: task.name,
              error: 'Task must be in progress (have worklogs) to be marked complete'
            });
            continue;
          }
        }

        // Mark task as complete
        task.status = 'done';
        task.completedBy = completedBy;
        task.completedAt = new Date();

        const savedTask = await this.taskRepository.save(task);

        // Log completion in project timeline
        await this.projectTimelineService.log({
          projectId: project.id,
          userId: completedBy,
          action: 'task_completed',
          details: `Task '${task.name}' marked as complete by ${user.name || user.username}.`
        });

        results.push({
          taskId: task.id,
          taskName: task.name,
          taskType: task.taskType,
          status: 'completed',
          completedBy: completedBy,
          completedAt: savedTask.completedAt,
          projectAllowsSubtaskWorklog: project.allowSubtaskWorklog
        });

      } catch (error) {
        errors.push({
          taskId: task.id,
          taskName: task.name,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return {
      success: results,
      errors: errors,
      summary: {
        total: taskIds.length,
        completed: results.length,
        failed: errors.length
      },
      message: `${results.length} task(s) marked complete${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    };
  }

  async firstVerifyTasks(firstVerifyTaskDto: FirstVerifyTaskDto): Promise<any> {
    const { taskIds, firstVerifiedBy } = firstVerifyTaskDto;

    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: firstVerifiedBy } });
    if (!user) {
      throw new NotFoundException(`User with ID ${firstVerifiedBy} not found`);
    }

    // Get all tasks with their relations
    const tasks = await this.taskRepository.find({
      where: { id: In(taskIds) },
      relations: ['project'],
    });

    if (tasks.length !== taskIds.length) {
      throw new NotFoundException('One or more tasks not found');
    }

    const results = [];
    const errors = [];

    for (const task of tasks) {
      try {
        // Get project for timeline logging
        const project = task.project;
        if (!project) {
          errors.push({
            taskId: task.id,
            taskName: task.name,
            error: 'Task has no associated project'
          });
          continue;
        }

        // Validation: Task must be completed to be verified
        if (task.status !== 'done') {
          errors.push({
            taskId: task.id,
            taskName: task.name,
            error: 'Task must be completed before it can be verified'
          });
          continue;
        }

        // Check if task is already first verified
        if (task.firstVerifiedBy) {
          errors.push({
            taskId: task.id,
            taskName: task.name,
            error: `Task already first verified by ${task.firstVerifiedBy}`
          });
          continue;
        }

        // Mark task as first verified
        task.firstVerifiedBy = firstVerifiedBy;
        task.firstVerifiedAt = new Date();

        const savedTask = await this.taskRepository.save(task);

        // Log first verification in project timeline
        await this.projectTimelineService.log({
          projectId: project.id,
          userId: firstVerifiedBy,
          action: 'task_first_verified',
          details: `Task '${task.name}' first verified by ${user.name || user.username}.`
        });

        results.push({
          taskId: task.id,
          taskName: task.name,
          taskType: task.taskType,
          status: 'first_verified',
          firstVerifiedBy: firstVerifiedBy,
          firstVerifiedAt: savedTask.firstVerifiedAt
        });

      } catch (error) {
        errors.push({
          taskId: task.id,
          taskName: task.name,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return {
      success: results,
      errors: errors,
      summary: {
        total: taskIds.length,
        firstVerified: results.length,
        failed: errors.length
      },
      message: `${results.length} task(s) first verified${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    };
  }

  async secondVerifyTasks(secondVerifyTaskDto: SecondVerifyTaskDto): Promise<any> {
    const { taskIds, secondVerifiedBy } = secondVerifyTaskDto;

    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: secondVerifiedBy } });
    if (!user) {
      throw new NotFoundException(`User with ID ${secondVerifiedBy} not found`);
    }

    // Get all tasks with their relations
    const tasks = await this.taskRepository.find({
      where: { id: In(taskIds) },
      relations: ['project'],
    });

    if (tasks.length !== taskIds.length) {
      throw new NotFoundException('One or more tasks not found');
    }

    const results = [];
    const errors = [];

    for (const task of tasks) {
      try {
        // Get project for timeline logging
        const project = task.project;
        if (!project) {
          errors.push({
            taskId: task.id,
            taskName: task.name,
            error: 'Task has no associated project'
          });
          continue;
        }

        // Validation: Task must be completed and first verified
        if (task.status !== 'done') {
          errors.push({
            taskId: task.id,
            taskName: task.name,
            error: 'Task must be completed before it can be second verified'
          });
          continue;
        }

        if (!task.firstVerifiedBy) {
          errors.push({
            taskId: task.id,
            taskName: task.name,
            error: 'Task must be first verified before second verification'
          });
          continue;
        }

        // Check if task is already second verified
        if (task.secondVerifiedBy) {
          errors.push({
            taskId: task.id,
            taskName: task.name,
            error: `Task already second verified by ${task.secondVerifiedBy}`
          });
          continue;
        }

        // Mark task as second verified
        task.secondVerifiedBy = secondVerifiedBy;
        task.secondVerifiedAt = new Date();

        const savedTask = await this.taskRepository.save(task);

        // Log second verification in project timeline
        await this.projectTimelineService.log({
          projectId: project.id,
          userId: secondVerifiedBy,
          action: 'task_second_verified',
          details: `Task '${task.name}' second verified by ${user.name || user.username}.`
        });

        results.push({
          taskId: task.id,
          taskName: task.name,
          taskType: task.taskType,
          status: 'second_verified',
          secondVerifiedBy: secondVerifiedBy,
          secondVerifiedAt: savedTask.secondVerifiedAt
        });

      } catch (error) {
        errors.push({
          taskId: task.id,
          taskName: task.name,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return {
      success: results,
      errors: errors,
      summary: {
        total: taskIds.length,
        secondVerified: results.length,
        failed: errors.length
      },
      message: `${results.length} task(s) second verified${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    };
  }
}
