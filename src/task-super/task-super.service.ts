import { TaskSuper } from './entities/task-super.entity';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection, In } from 'typeorm';
import { CreateTaskSuperDto } from './dto/create-task-super.dto';
import { UpdateTaskSuperDto } from './dto/update-task-super.dto';
import { AddToProjectDto, AddToProjectNewFormatDto } from './dto/add-to-project.dto';
import { HierarchicalProjectAssignDto } from './dto/hierarchical-project-assign.dto';
import { TaskSuperProject } from './entities/task-super-project.entity';
import { TaskGroupProject } from '../task-groups/entities/task-group-project.entity';
import { TaskGroup } from '../task-groups/entities/task-group.entity';
import { TaskTemplate } from '../task-template/entities/task-template.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class TaskSuperService {
  constructor(
    @InjectRepository(TaskSuper)
    private readonly taskSuperRepository: Repository<TaskSuper>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskSuperProject)
    private readonly taskSuperProjectRepository: Repository<TaskSuperProject>,
    @InjectRepository(TaskGroupProject)
    private readonly taskGroupProjectRepository: Repository<TaskGroupProject>,
    @InjectRepository(TaskGroup)
    private readonly taskGroupRepository: Repository<TaskGroup>,
    @InjectRepository(TaskTemplate)
    private readonly taskTemplateRepository: Repository<TaskTemplate>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private connection: Connection,
  ) {}


  async updateGlobalRankings(rankings: { id: string; rank: number }[]) {
    // Validate UUIDs and ranks
    const isValidUUID = (id: any): boolean => {
      if (!id || typeof id !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    };

    const validRankings = rankings.filter(({ id }) => isValidUUID(id));
    if (validRankings.length === 0) {
      return { success: false, message: 'No valid TaskSuper IDs to update' };
    }

    // Update each TaskSuper's rank
    const updatePromises = validRankings.map(({ id, rank }) => {
      return this.taskSuperRepository.createQueryBuilder()
        .update(TaskSuper)
        .set({ rank })
        .where('id = :id', { id })
        .execute();
    });

    await Promise.all(updatePromises);
    return { success: true, message: 'TaskSuper rankings updated successfully' };
  }

  async create(createTaskSuperDto: CreateTaskSuperDto): Promise<TaskSuper> {
    const taskSuper = this.taskSuperRepository.create(createTaskSuperDto);
    return this.taskSuperRepository.save(taskSuper);
  }

  async findAll(): Promise<TaskSuper[]> {
    return this.taskSuperRepository.find({
      order: {
        rank: 'ASC',
        updatedAt: 'DESC',
      },
      relations: ['taskGroups'],
    });
  }

  async findOne(id: string): Promise<TaskSuper> {
    const taskSuper = await this.taskSuperRepository.findOne({
      where: { id },
      relations: ['taskGroups'],
    });

    if (!taskSuper) {
      throw new NotFoundException(`TaskSuper with ID ${id} not found`);
    }

    return taskSuper;
  }

  async update(id: string, updateTaskSuperDto: UpdateTaskSuperDto): Promise<TaskSuper> {
    const taskSuper = await this.taskSuperRepository.findOne({
      where: { id }
    });
    
    if (!taskSuper) {
      throw new NotFoundException(`TaskSuper with ID ${id} not found`);
    }
    
    this.taskSuperRepository.merge(taskSuper, updateTaskSuperDto);
    return this.taskSuperRepository.save(taskSuper);
  }

  async remove(id: string): Promise<void> {
    const taskSuper = await this.taskSuperRepository.findOne({
      where: { id }
    });
    
    if (!taskSuper) {
      throw new NotFoundException(`TaskSuper with ID ${id} not found`);
    }
    
    await this.taskSuperRepository.remove(taskSuper);
  }
  
  // Helper method to validate task names for duplicates within a project
  private async validateTaskNames(projectId: string, items: any[]): Promise<{ valid: boolean; duplicates: any[] }> {
    // Extract all task names from the payload (both templates and subtasks)
    const taskNames = items
      .filter(item => item.type === 'template' || item.type === 'subtask')
      .map(item => ({
        id: item.id,
        name: item.name,
        type: item.type
      }));
    
    // If no tasks to check, return valid
    if (taskNames.length === 0) {
      return { valid: true, duplicates: [] };
    }
    
    // Find all existing tasks in this project
    const existingTasks = await this.taskRepository.find({
      where: { project: { id: projectId } },
      select: ['name']
    });
    
    const existingNames = new Set(existingTasks.map(task => task.name.toLowerCase()));
    
    // Check for duplicates among existing tasks
    const duplicatesWithExisting = taskNames.filter(task => 
      existingNames.has(task.name.toLowerCase())
    );
    
    // Check for duplicates within the payload itself
    const nameCountMap = new Map<string, { count: number, items: any[] }>();
    
    taskNames.forEach(task => {
      const lowerName = task.name.toLowerCase();
      if (!nameCountMap.has(lowerName)) {
        nameCountMap.set(lowerName, { count: 0, items: [] });
      }
      
      const entry = nameCountMap.get(lowerName);
      entry.count += 1;
      entry.items.push(task);
    });
    
    // Find names that appear more than once in the payload
    const duplicatesWithinPayload: any[] = [];
    nameCountMap.forEach(({ count, items }, name) => {
      if (count > 1) {
        duplicatesWithinPayload.push(...items);
      }
    });
    
    // Combine both types of duplicates
    const allDuplicates = [...duplicatesWithExisting, ...duplicatesWithinPayload];
    
    return {
      valid: allDuplicates.length === 0,
      duplicates: allDuplicates
    };
  }

  // Helper method to find or create a TaskSuperProject for a project
  private async findOrCreateTaskSuperProject(
    originalTaskSuper: TaskSuper,
    projectId: string,
    suffix?: string
  ): Promise<TaskSuperProject> {
    // First check if a TaskSuperProject already exists for this TaskSuper and project
    const existingTaskSuperProject = await this.taskSuperProjectRepository.findOne({
      where: {
        originalTaskSuperId: originalTaskSuper.id,
        projectId: projectId
      }
    });

    if (existingTaskSuperProject) {
      return existingTaskSuperProject;
    }

    // If no existing project-specific TaskSuper, create a new one
    const newTaskSuperProject = new TaskSuperProject();
    newTaskSuperProject.name = originalTaskSuper.name + (suffix || '');
    newTaskSuperProject.description = originalTaskSuper.description || '';
    newTaskSuperProject.rank = originalTaskSuper.rank;
    newTaskSuperProject.originalTaskSuperId = originalTaskSuper.id;
    newTaskSuperProject.projectId = projectId;
    
    // Set project relation
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    newTaskSuperProject.project = project;

    const savedTaskSuperProject = await this.taskSuperProjectRepository.save(newTaskSuperProject);
    return savedTaskSuperProject;
  }

  // Helper method to find or create a TaskGroupProject for a project
  private async findOrCreateTaskGroupProject(
    originalTaskGroup: TaskGroup,
    taskSuperProject: TaskSuperProject,
    projectId: string,
    suffix?: string
  ): Promise<TaskGroupProject> {
    // First check if a TaskGroupProject already exists for this TaskGroup and project
    const existingTaskGroupProject = await this.taskGroupProjectRepository.findOne({
      where: {
        originalTaskGroupId: originalTaskGroup.id,
        projectId: projectId
      }
    });

    if (existingTaskGroupProject) {
      return existingTaskGroupProject;
    }

    // If no existing project-specific TaskGroup, create a new one
    const newTaskGroupProject = new TaskGroupProject();
    newTaskGroupProject.name = originalTaskGroup.name + (suffix || '');
    newTaskGroupProject.description = originalTaskGroup.description || '';
    newTaskGroupProject.rank = originalTaskGroup.rank;
    newTaskGroupProject.originalTaskGroupId = originalTaskGroup.id;
    newTaskGroupProject.projectId = projectId;
    newTaskGroupProject.taskSuperId = taskSuperProject.id;
    
    // Set relations
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    
    newTaskGroupProject.project = project;
    newTaskGroupProject.taskSuper = taskSuperProject;

    const savedTaskGroupProject = await this.taskGroupProjectRepository.save(newTaskGroupProject);
    return savedTaskGroupProject;
  }
  
  // Helper method to determine parent-child relationships between templates
  private async determineTemplateRelationships(templateIds: string[]): Promise<Map<string, string[]>> {
    // Map of parent template ID to array of child template IDs
    const parentChildMap = new Map<string, string[]>();
    
    // Find all templates and their potential subtasks
    const templates = await this.taskTemplateRepository.find({
      where: { id: In(templateIds) },
      relations: ['parentTask', 'subTasks']
    });
    
    // Build a map of parent to children
    templates.forEach(template => {
      // If template is a parent (has subtasks)
      if (template.subTasks && template.subTasks.length > 0) {
        const childIds = template.subTasks.map(subtask => subtask.id);
        parentChildMap.set(template.id, childIds);
      }
      
      // If template is a child (has parent)
      if (template.parentTask) {
        const parentId = template.parentTask.id;
        // Add to existing parent's children list or create new entry
        if (parentChildMap.has(parentId)) {
          parentChildMap.get(parentId).push(template.id);
        } else {
          parentChildMap.set(parentId, [template.id]);
        }
      }
    });
    
    console.log('Template relationships:', Object.fromEntries(parentChildMap));
    return parentChildMap;
  }
  
  async addToProject(addToProjectDto: AddToProjectDto): Promise<any> {
    const { 
      taskSuperId, 
      projectId, 
      suffixTaskSuper, 
      suffixTaskGroup, 
      suffixTaskTemplate, 
      selectedTemplates = [], 
      selectedSubtasks = [],
      metadata = {}
    } = addToProjectDto;
    
    // Log the incoming payload for debugging
    console.log('Processing addToProject payload:', {
      taskSuperId, 
      projectId,
      templateCount: selectedTemplates.length,
      subtaskCount: selectedSubtasks.length,
      metadata
    });
    
    // Convert DTO to items format for validation
    const itemsForValidation = [
      ...selectedTemplates.map(template => ({
        id: template.id,
        name: template.name,
        type: 'template'
      })),
      ...selectedSubtasks.map(subtask => ({
        id: subtask.id,
        name: subtask.name,
        type: 'subtask'
      }))
    ];
    
    // Validate no duplicate task names
    const nameValidation = await this.validateTaskNames(projectId, itemsForValidation);
    if (!nameValidation.valid) {
      const duplicateNames = nameValidation.duplicates.map(d => d.name).join(', ');
      throw new BadRequestException({
        message: `Tasks with duplicate names detected: ${duplicateNames}`,
        statusCode: 400,
        error: 'Bad Request',
        duplicates: nameValidation.duplicates
      });
    }
    
    // Validate task super
    const taskSuper = await this.taskSuperRepository.findOne({
      where: { id: taskSuperId },
      relations: ['taskGroups', 'taskGroups.tasktemplate'],
    });
    
    if (!taskSuper) {
      throw new NotFoundException(`TaskSuper with ID ${taskSuperId} not found`);
    }
    
    // Start a transaction
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Find or create TaskSuperProject
      const taskSuperProject = await this.findOrCreateTaskSuperProject(
        taskSuper, 
        projectId, 
        suffixTaskSuper
      );
      
      // Map to store created task group projects (key: original task group ID)
      const taskGroupMap = new Map<string, TaskGroupProject>();
      
      // Map to store created tasks (key: original template ID)
      const taskMap = new Map<string, Task>();
      
      // Collect all template IDs to determine parent-child relationships
      const templateIds = [
        ...selectedTemplates.map(t => t.id),
        ...selectedSubtasks.map(s => s.id)
      ];
      
      // Get template relationship map (parent template ID -> array of child template IDs)
      const templateRelationships = await this.determineTemplateRelationships(templateIds);
      
      // Process parent templates first
      console.log('Processing parent templates...');
      
      // Determine which templates are parents
      const parentTemplateIds = new Set<string>();
      const childTemplateIds = new Set<string>();
      
      // Fill parent and child sets
      templateRelationships.forEach((children, parentId) => {
        parentTemplateIds.add(parentId);
        children.forEach(childId => childTemplateIds.add(childId));
      });
      
      // Identify templates with no parents (root templates)
      const rootTemplates = selectedTemplates.filter(template => 
        !childTemplateIds.has(template.id) || parentTemplateIds.has(template.id)
      );
      
      console.log(`Found ${rootTemplates.length} root templates out of ${selectedTemplates.length} total templates`);
      
      // Process all root/parent templates first
      for (const template of rootTemplates) {
        const { groupId, groupName } = template;
        
        // Get the original task group
        const originalTaskGroup = await this.taskGroupRepository.findOne({ where: { id: groupId } });
        if (!originalTaskGroup) {
          console.warn(`TaskGroup with ID ${groupId} not found, skipping template ${template.name}`);
          continue;
        }
        
        // Find or create the task group project
        let taskGroupProject: TaskGroupProject;
        if (taskGroupMap.has(groupId)) {
          taskGroupProject = taskGroupMap.get(groupId);
        } else {
          taskGroupProject = await this.findOrCreateTaskGroupProject(
            originalTaskGroup,
            taskSuperProject,
            projectId,
            suffixTaskGroup
          );
          taskGroupMap.set(groupId, taskGroupProject);
        }
        
        // Create the task
        const taskProject = {
          name: template.name, // Use name as provided (already suffixed if needed)
          description: template.description || '',
          budgetedHours: template.budgetedHours || 0,
          rank: template.rank || 0,
          project: { id: projectId },
          groupProject: { id: taskGroupProject.id },
          taskType: 'story' as 'story' | 'task',
          status: 'open' as 'open' | 'in_progress' | 'done',
        };
        
        const savedTask = await queryRunner.manager.save(Task, taskProject);
        
        // Store the created task for later reference by subtasks
        taskMap.set(template.id, savedTask);
        
        console.log(`Created parent task: ${savedTask.name} (${savedTask.id}) for template: ${template.id}`);
      }
      
      // Now process subtasks, ensuring they reference the correct parent tasks
      console.log('Processing subtasks...');
      
      // Process subtasks from the payload
      for (const subtask of selectedSubtasks) {
        const { groupId, templateId } = subtask;
        
        if (!templateId) {
          console.warn(`Skipping subtask ${subtask.name} with missing parent template reference`);
          continue;
        }
        
        // Get the parent task that was created for this subtask's template
        const parentTask = taskMap.get(templateId);
        if (!parentTask) {
          console.warn(`Skipping subtask ${subtask.name}: Parent task for template ${templateId} not found`);
          continue;
        }
        
        // Get the original task group
        const originalTaskGroup = await this.taskGroupRepository.findOne({ where: { id: groupId } });
        if (!originalTaskGroup) {
          console.warn(`TaskGroup with ID ${groupId} not found, skipping subtask ${subtask.name}`);
          continue;
        }
        
        // Find or create the task group project
        let taskGroupProject: TaskGroupProject;
        if (taskGroupMap.has(groupId)) {
          taskGroupProject = taskGroupMap.get(groupId);
        } else {
          taskGroupProject = await this.findOrCreateTaskGroupProject(
            originalTaskGroup,
            taskSuperProject,
            projectId,
            suffixTaskGroup
          );
          taskGroupMap.set(groupId, taskGroupProject);
        }
        
        // Create the subtask
        const taskProject = {
          name: subtask.name, // Use name as provided (already suffixed if needed)
          description: subtask.description || '',
          budgetedHours: subtask.budgetedHours || 0,
          rank: subtask.rank || 0,
          project: { id: projectId },
          groupProject: { id: taskGroupProject.id },
          taskType: 'task' as 'story' | 'task',
          status: 'open' as 'open' | 'in_progress' | 'done',
          parentTask: { id: parentTask.id },
        };
        
        const savedTask = await queryRunner.manager.save(Task, taskProject);
        
        console.log(`Created subtask: ${savedTask.name} (${savedTask.id}) for parent task: ${parentTask.name} (${parentTask.id})`);
      }
      
      // Also check templateRelationships to create any subtasks that weren't explicitly sent
      // But only if the 'explicitSelectionOnly' flag is not set
      if (!metadata.explicitSelectionOnly) {
        console.log('Processing implicit subtasks from template relationships...');
        
        // Loop through parent templates that were created
        for (const [parentTemplateId, childTemplateIds] of templateRelationships.entries()) {
          const parentTask = taskMap.get(parentTemplateId);
          if (!parentTask) {
            console.log(`Parent task for template ${parentTemplateId} not found, skipping implicit subtasks`);
            continue;
          }
          
          // Find subtasks that haven't been processed yet
          const implicitSubtasks = childTemplateIds.filter(childId => 
            !selectedSubtasks.some(subtask => subtask.id === childId)
          );
          
          if (implicitSubtasks.length === 0) {
            continue;
          }
          
          console.log(`Processing ${implicitSubtasks.length} implicit subtasks for parent ${parentTask.name}`);
          
          // Process each implicit subtask
          for (const childTemplateId of implicitSubtasks) {
            // Get child template details
            const childTemplate = await this.taskTemplateRepository.findOne({
              where: { id: childTemplateId },
              relations: ['group']
            });
            
            if (!childTemplate) {
              console.warn(`Child template ${childTemplateId} not found, skipping`);
              continue;
            }
            
            const groupId = childTemplate.group?.id;
            if (!groupId) {
              console.warn(`Child template ${childTemplate.name} has no group, skipping`);
              continue;
            }
            
            // Get the original task group
            const originalTaskGroup = await this.taskGroupRepository.findOne({ where: { id: groupId } });
            if (!originalTaskGroup) {
              console.warn(`TaskGroup with ID ${groupId} not found, skipping template ${childTemplate.name}`);
              continue;
            }
            
            // Find or create the task group project
            let taskGroupProject: TaskGroupProject;
            if (taskGroupMap.has(groupId)) {
              taskGroupProject = taskGroupMap.get(groupId);
            } else {
              taskGroupProject = await this.findOrCreateTaskGroupProject(
                originalTaskGroup,
                taskSuperProject,
                projectId,
                suffixTaskGroup
              );
              taskGroupMap.set(groupId, taskGroupProject);
            }
            
            // Create the implicit subtask
            const taskProject = {
              name: childTemplate.name, // Use name as provided (already suffixed if needed)
              description: childTemplate.description || '',
              budgetedHours: childTemplate.budgetedHours || 0,
              rank: childTemplate.rank || 0,
              project: { id: projectId },
              groupProject: { id: taskGroupProject.id },
              taskType: 'task' as 'story' | 'task',
              status: 'open' as 'open' | 'in_progress' | 'done',
              parentTask: { id: parentTask.id },
            };
            
            const savedTask = await queryRunner.manager.save(Task, taskProject);
            console.log(`Created implicit subtask: ${savedTask.name} (${savedTask.id}) for parent task: ${parentTask.name} (${parentTask.id})`);
          }
        }
      } else {
        console.log('Explicit selection only flag is set, skipping implicit subtasks');
      }
      
      // Commit the transaction
      await queryRunner.commitTransaction();
      
      return {
        success: true,
        message: 'Tasks added to project successfully',
        taskSuperProjectId: taskSuperProject.id,
      };
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      
      // Enhanced error handling with more context
      console.error('Error adding tasks to project:', error);
      
      // Format a more helpful error message based on the type of error
      let errorMessage = error.message;
      
      // Handle foreign key constraint violations specifically
      if (error.message.includes('foreign key constraint')) {
        errorMessage = `Foreign key constraint error: ${error.message}. This typically means a parent-child relationship is invalid. Check that all subtasks have valid parent templates.`;
      }
      
      throw new BadRequestException('Failed to add tasks to project: ' + errorMessage);
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }
  
  async addToProjectNewFormat(addToProjectDto: AddToProjectNewFormatDto): Promise<any> {
    const { 
      taskSuperId, 
      projectId, 
      items = []
    } = addToProjectDto;
    
    // Log the incoming payload for debugging
    console.log('Processing addToProjectNewFormat payload:', {
      taskSuperId, 
      projectId,
      itemCount: items.length,
      itemTypes: items.map(item => item.type)
    });
    
    // Validate no duplicate task names
    const nameValidation = await this.validateTaskNames(projectId, items);
    if (!nameValidation.valid) {
      const duplicateNames = nameValidation.duplicates.map(d => d.name).join(', ');
      throw new BadRequestException({
        message: `Tasks with duplicate names detected: ${duplicateNames}`,
        statusCode: 400,
        error: 'Bad Request',
        duplicates: nameValidation.duplicates
      });
    }
    
    // Validate task super
    const taskSuper = await this.taskSuperRepository.findOne({
      where: { id: taskSuperId },
      relations: ['taskGroups', 'taskGroups.tasktemplate'],
    });
    
    if (!taskSuper) {
      throw new NotFoundException(`TaskSuper with ID ${taskSuperId} not found`);
    }
    
    // Start a transaction
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // First, identify if we have a taskSuper item for naming
      const taskSuperItem = items.find(item => item.type === 'taskSuper');
      
      // Find or create TaskSuperProject
      let taskSuperProject: TaskSuperProject;
      
      // Try to find existing TaskSuperProject first
      const existingTaskSuperProject = await this.taskSuperProjectRepository.findOne({
        where: {
          originalTaskSuperId: taskSuperId,
          projectId: projectId
        }
      });
      
      if (existingTaskSuperProject) {
        console.log(`Reusing existing TaskSuperProject: ${existingTaskSuperProject.name} (${existingTaskSuperProject.id})`);
        taskSuperProject = existingTaskSuperProject;
      } else {
        // Create a new TaskSuperProject
        const newTaskSuperProject = new TaskSuperProject();
        newTaskSuperProject.name = taskSuperItem?.name || taskSuper.name;
        newTaskSuperProject.description = taskSuper.description || '';
        newTaskSuperProject.rank = taskSuper.rank;
        newTaskSuperProject.originalTaskSuperId = taskSuperId;
        newTaskSuperProject.projectId = projectId;
        
        // Set project relation
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) {
          throw new NotFoundException(`Project with ID ${projectId} not found`);
        }
        newTaskSuperProject.project = project;
        
        taskSuperProject = await this.taskSuperProjectRepository.save(newTaskSuperProject);
        console.log(`Created new TaskSuperProject: ${taskSuperProject.name} (${taskSuperProject.id})`);
      }
      
      // Map to store created task group projects (key: original task group ID)
      const taskGroupMap = new Map<string, TaskGroupProject>();
      
      // Map to store created tasks (key: original template ID)
      const taskMap = new Map<string, Task>();
      
      // Process task groups first
      const groupItems = items.filter(item => item.type === 'taskGroup');
      for (const groupItem of groupItems) {
        // Check if we've already processed this group
        if (taskGroupMap.has(groupItem.id)) {
          continue;
        }
        
        // Get the original task group
        const originalTaskGroup = await this.taskGroupRepository.findOne({ 
          where: { id: groupItem.id }
        });
        
        if (!originalTaskGroup) {
          console.warn(`TaskGroup with ID ${groupItem.id} not found, skipping`);
          continue;
        }
        
        // Find or create project-specific TaskGroup
        const taskGroupProject = await this.findOrCreateTaskGroupProject(
          originalTaskGroup,
          taskSuperProject,
          projectId
        );
        
        taskGroupMap.set(groupItem.id, taskGroupProject);
      }
      
      // Collect all template IDs to determine parent-child relationships
      const templateIds = items
        .filter(item => item.type === 'template' || item.type === 'subtask')
        .map(item => item.id);
      
      // Get template relationship map (parent template ID -> array of child template IDs)
      const templateRelationships = await this.determineTemplateRelationships(templateIds);
      
      // Determine which templates are parents and which are children
      const parentTemplateIds = new Set<string>();
      const childTemplateIds = new Set<string>();
      
      // Fill parent and child sets based on relationships
      templateRelationships.forEach((children, parentId) => {
        parentTemplateIds.add(parentId);
        children.forEach(childId => childTemplateIds.add(childId));
      });
      
      // Also add any explicit parent-child relationships from payload
      items.forEach(item => {
        if (item.type === 'subtask' && item.templateId) {
          childTemplateIds.add(item.id);
          parentTemplateIds.add(item.templateId);
        }
      });
      
      // Process templates first (parent tasks)
      const templateItems = items.filter(item => 
        item.type === 'template' && !childTemplateIds.has(item.id)
      );
      
      console.log(`Processing ${templateItems.length} parent templates...`);
      
      for (const templateItem of templateItems) {
        const { groupId } = templateItem;
        
        if (!groupId) {
          console.warn(`Template ${templateItem.id} has no groupId, skipping`);
          continue;
        }
        
        // Get the original task group if we haven't already
        if (!taskGroupMap.has(groupId)) {
          const originalTaskGroup = await this.taskGroupRepository.findOne({ 
            where: { id: groupId } 
          });
          
          if (!originalTaskGroup) {
            console.warn(`TaskGroup with ID ${groupId} not found, skipping template ${templateItem.name}`);
            continue;
          }
          
          const taskGroupProject = await this.findOrCreateTaskGroupProject(
            originalTaskGroup,
            taskSuperProject,
            projectId
          );
          
          taskGroupMap.set(groupId, taskGroupProject);
        }
        
        // Get the task group project
        const taskGroupProject = taskGroupMap.get(groupId);
        
        // Create Task for the template
        const taskProject = {
          name: templateItem.name,
          description: templateItem.description || '',
          budgetedHours: templateItem.budgetedHours || 0,
          rank: templateItem.rank || 0,
          project: { id: projectId },
          groupProject: { id: taskGroupProject.id },
          taskType: 'story' as 'story' | 'task',
          status: 'open' as 'open' | 'in_progress' | 'done',
        };
        
        const savedTask = await queryRunner.manager.save(Task, taskProject);
        
        // Store the created task for later reference by subtasks
        taskMap.set(templateItem.id, savedTask);
        
        console.log(`Created parent task: ${savedTask.name} (${savedTask.id}) for template: ${templateItem.id}`);
      }
      
      // Process subtasks after all parent tasks are created
      const subtaskItems = items.filter(item => item.type === 'subtask');
      console.log(`Processing ${subtaskItems.length} subtasks...`);
      
      for (const subtaskItem of subtaskItems) {
        const { groupId, templateId } = subtaskItem;
        
        if (!groupId || !templateId) {
          console.warn(`Subtask ${subtaskItem.id} is missing groupId or templateId, skipping`);
          continue;
        }
        
        // Get the parent task that was created for this subtask's template
        const parentTask = taskMap.get(templateId);
        
        // Skip if parent task wasn't created
        if (!parentTask) {
          // If template wasn't explicitly included but was referenced as a parent,
          // we need to create it now
          const templateItem = items.find(item => item.type === 'template' && item.id === templateId);
          
          if (templateItem) {
            console.log(`Parent task for template ${templateId} not found, creating it now...`);
            
            // Ensure we have the task group
            if (!taskGroupMap.has(templateItem.groupId)) {
              const originalTaskGroup = await this.taskGroupRepository.findOne({ 
                where: { id: templateItem.groupId } 
              });
              
              if (!originalTaskGroup) {
                console.warn(`TaskGroup with ID ${templateItem.groupId} not found, skipping subtask ${subtaskItem.name}`);
                continue;
              }
              
              const taskGroupProject = await this.findOrCreateTaskGroupProject(
                originalTaskGroup,
                taskSuperProject,
                projectId
              );
              
              taskGroupMap.set(templateItem.groupId, taskGroupProject);
            }
            
            // Create the parent task
            const taskGroupProject = taskGroupMap.get(templateItem.groupId);
            
            const taskProject = {
              name: templateItem.name,
              description: templateItem.description || '',
              budgetedHours: templateItem.budgetedHours || 0,
              rank: templateItem.rank || 0,
              project: { id: projectId },
              groupProject: { id: taskGroupProject.id },
              taskType: 'story' as 'story' | 'task',
              status: 'open' as 'open' | 'in_progress' | 'done',
            };
            
            const savedParentTask = await queryRunner.manager.save(Task, taskProject);
            taskMap.set(templateId, savedParentTask);
            console.log(`Created missing parent task: ${savedParentTask.name} (${savedParentTask.id}) for template: ${templateId}`);
          } else {
            // Try to look up the template in the database
            const templateEntity = await this.taskTemplateRepository.findOne({
              where: { id: templateId },
              relations: ['group']
            });
            
            if (templateEntity) {
              console.log(`Parent template ${templateId} found in database, creating task for it...`);
              
              // Ensure we have the task group
              if (!taskGroupMap.has(templateEntity.group.id)) {
                const taskGroupProject = await this.findOrCreateTaskGroupProject(
                  templateEntity.group,
                  taskSuperProject,
                  projectId
                );
                
                taskGroupMap.set(templateEntity.group.id, taskGroupProject);
              }
              
              // Create the parent task
              const taskGroupProject = taskGroupMap.get(templateEntity.group.id);
              
              const taskProject = {
                name: templateEntity.name,
                description: templateEntity.description || '',
                budgetedHours: templateEntity.budgetedHours || 0,
                rank: templateEntity.rank || 0,
                project: { id: projectId },
                groupProject: { id: taskGroupProject.id },
                taskType: 'story' as 'story' | 'task',
                status: 'open' as 'open' | 'in_progress' | 'done',
              };
              
              const savedParentTask = await queryRunner.manager.save(Task, taskProject);
              taskMap.set(templateId, savedParentTask);
              console.log(`Created parent task from database: ${savedParentTask.name} (${savedParentTask.id}) for template: ${templateId}`);
            } else {
              console.warn(`Skipping subtask ${subtaskItem.name}: Parent task for template ${templateId} not found and couldn't be created`);
              continue;
            }
          }
        }
        
        // At this point we should have a valid parent task
        const parentTaskToUse = taskMap.get(templateId);
        if (!parentTaskToUse) {
          console.warn(`Still couldn't create parent task for template ${templateId}, skipping subtask ${subtaskItem.name}`);
          continue;
        }
        
        // Ensure we have the task group
        if (!taskGroupMap.has(groupId)) {
          const originalTaskGroup = await this.taskGroupRepository.findOne({ 
            where: { id: groupId } 
          });
          
          if (!originalTaskGroup) {
            console.warn(`TaskGroup with ID ${groupId} not found, skipping subtask ${subtaskItem.name}`);
            continue;
          }
          
          const taskGroupProject = await this.findOrCreateTaskGroupProject(
            originalTaskGroup,
            taskSuperProject,
            projectId
          );
          
          taskGroupMap.set(groupId, taskGroupProject);
        }
        
        // Create Task for the subtask
        const taskGroupProject = taskGroupMap.get(groupId);
        const taskProject = {
          name: subtaskItem.name,
          description: subtaskItem.description || '',
          budgetedHours: subtaskItem.budgetedHours || 0,
          rank: subtaskItem.rank || 0,
          project: { id: projectId },
          groupProject: { id: taskGroupProject.id },
          taskType: 'task' as 'story' | 'task',
          status: 'open' as 'open' | 'in_progress' | 'done',
          parentTask: { id: parentTaskToUse.id },
        };
        
        const savedTask = await queryRunner.manager.save(Task, taskProject);
        console.log(`Created subtask: ${savedTask.name} (${savedTask.id}) with parent task ID: ${parentTaskToUse.id} (from template: ${templateId})`);
      }
      
      // Commit the transaction
      await queryRunner.commitTransaction();
      
      return {
        success: true,
        message: 'Tasks added to project successfully',
        taskSuperProjectId: taskSuperProject.id,
      };
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      
      // Enhanced error handling with more context
      console.error('Error adding tasks to project (new format):', error);
      
      // Format a more helpful error message based on the type of error
      let errorMessage = error.message;
      
      // Handle foreign key constraint violations specifically
      if (error.message.includes('foreign key constraint')) {
        errorMessage = `Foreign key constraint error: ${error.message}. This typically means a parent-child relationship is invalid. Check that all subtasks have valid parent templates.`;
      }
      
      throw new BadRequestException('Failed to add tasks to project (new format): ' + errorMessage);
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }
  
  // New method for hierarchical project assignment
  async addToProjectHierarchical(dto: HierarchicalProjectAssignDto): Promise<any> {
    const { projectId, taskSupers } = dto;
    
    console.log('Processing hierarchical project assignment:', {
      projectId,
      taskSuperCount: taskSupers.length
    });
    
    // Validate project exists
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    
    // Build items for name validation
    const itemsForValidation = [];
    
    // Extract all task names from the hierarchical structure
    taskSupers.forEach(taskSuper => {
      taskSuper.groups.forEach(group => {
        group.templates.forEach(template => {
          // Add template
          itemsForValidation.push({
            id: template.id,
            name: template.name,
            type: 'template'
          });
          
          // Add subtasks
          template.subtasks.forEach(subtask => {
            itemsForValidation.push({
              id: subtask.id,
              name: subtask.name,
              type: 'subtask'
            });
          });
        });
      });
    });
    
    // Validate no duplicate task names
    const nameValidation = await this.validateTaskNames(projectId, itemsForValidation);
    if (!nameValidation.valid) {
      const duplicateNames = nameValidation.duplicates.map(d => d.name).join(', ');
      throw new BadRequestException({
        message: `Tasks with duplicate names detected: ${duplicateNames}`,
        statusCode: 400,
        error: 'Bad Request',
        duplicates: nameValidation.duplicates
      });
    }
    
    // Start a transaction
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Maps to store created entities for relationships
      const taskSuperProjectMap = new Map<string, TaskSuperProject>();
      const taskGroupProjectMap = new Map<string, TaskGroupProject>();
      const taskMap = new Map<string, Task>();
      
      // Process each TaskSuper
      for (const taskSuperDto of taskSupers) {
        // If the TaskSuper is new, create it in the database first
        let taskSuper: TaskSuper;
        
        if (taskSuperDto.isNew) {
          console.log(`Creating new TaskSuper: ${taskSuperDto.name}`);
          
          const newTaskSuper = this.taskSuperRepository.create({
            name: taskSuperDto.name,
            description: taskSuperDto.description,
            rank: taskSuperDto.rank || 0
          });
          
          taskSuper = await this.taskSuperRepository.save(newTaskSuper);
          console.log(`Created new TaskSuper with ID: ${taskSuper.id}`);
        } else {
          // Fetch existing TaskSuper
          taskSuper = await this.taskSuperRepository.findOne({
            where: { id: taskSuperDto.id }
          });
          
          if (!taskSuper) {
            throw new NotFoundException(`TaskSuper with ID ${taskSuperDto.id} not found`);
          }
        }
        
        // Create TaskSuperProject
        const taskSuperProject = await this.findOrCreateTaskSuperProject(
          taskSuper,
          projectId
        );
        
        taskSuperProjectMap.set(taskSuperDto.id, taskSuperProject);
        
        // Process each TaskGroup in this TaskSuper
        for (const groupDto of taskSuperDto.groups) {
          // Skip if the group is not for this TaskSuper
          if (groupDto.isNew && !taskSuperDto.isNew) {
            // For a new group with existing TaskSuper, we need to set the TaskSuper ID
            console.log(`Creating new TaskGroup: ${groupDto.name} for TaskSuper: ${taskSuper.id}`);
            
            const newTaskGroup = this.taskGroupRepository.create({
              name: groupDto.name,
              description: groupDto.description,
              rank: groupDto.rank || 0,
              taskSuper: { id: taskSuper.id },
              taskSuperId: taskSuper.id
            });
            
            const savedTaskGroup = await this.taskGroupRepository.save(newTaskGroup);
            console.log(`Created new TaskGroup with ID: ${savedTaskGroup.id}`);
            
            // Update the DTO ID for reference
            groupDto.id = savedTaskGroup.id;
          } else if (groupDto.isNew) {
            // For new TaskSuper and new TaskGroup
            console.log(`Creating new TaskGroup: ${groupDto.name} for new TaskSuper: ${taskSuper.id}`);
            
            const newTaskGroup = this.taskGroupRepository.create({
              name: groupDto.name,
              description: groupDto.description,
              rank: groupDto.rank || 0,
              taskSuper: { id: taskSuper.id },
              taskSuperId: taskSuper.id
            });
            
            const savedTaskGroup = await this.taskGroupRepository.save(newTaskGroup);
            console.log(`Created new TaskGroup with ID: ${savedTaskGroup.id}`);
            
            // Update the DTO ID for reference
            groupDto.id = savedTaskGroup.id;
          }
          
          // Get the TaskGroup
          const taskGroup = await this.taskGroupRepository.findOne({
            where: { id: groupDto.id }
          });
          
          if (!taskGroup) {
            throw new NotFoundException(`TaskGroup with ID ${groupDto.id} not found`);
          }
          
          // Create TaskGroupProject
          const taskGroupProject = await this.findOrCreateTaskGroupProject(
            taskGroup,
            taskSuperProject,
            projectId
          );
          
          taskGroupProjectMap.set(groupDto.id, taskGroupProject);
          
          // Process each TaskTemplate in this TaskGroup
          for (const templateDto of groupDto.templates) {
            // Handle new template creation if needed
            if (templateDto.isNew) {
              console.log(`Creating new TaskTemplate: ${templateDto.name} for TaskGroup: ${taskGroup.id}`);
              
              const newTaskTemplate = this.taskTemplateRepository.create({
                name: templateDto.name,
                description: templateDto.description,
                budgetedHours: templateDto.budgetedHours || 0,
                rank: templateDto.rank || 0,
                taskType: 'story',
                group: { id: taskGroup.id }
              });
              
              const savedTaskTemplate = await this.taskTemplateRepository.save(newTaskTemplate);
              console.log(`Created new TaskTemplate with ID: ${savedTaskTemplate.id}`);
              
              // Update the DTO ID for reference
              templateDto.id = savedTaskTemplate.id;
            }
            
            // Create Task for the template
            const taskProject = {
              name: templateDto.name,
              description: templateDto.description || '',
              budgetedHours: templateDto.budgetedHours || 0,
              rank: templateDto.rank || 0,
              project: { id: projectId },
              groupProject: { id: taskGroupProject.id },
              taskType: 'story' as 'story' | 'task',
              status: 'open' as 'open' | 'in_progress' | 'done',
            };
            
            const savedTask = await queryRunner.manager.save(Task, taskProject);
            taskMap.set(templateDto.id, savedTask);
            
            console.log(`Created task: ${savedTask.name} (${savedTask.id}) for template: ${templateDto.id}`);
            
            // Process each Subtask Template
            for (const subtaskDto of templateDto.subtasks) {
              // Handle new subtask creation if needed
              if (subtaskDto.isNew) {
                console.log(`Creating new SubtaskTemplate: ${subtaskDto.name} for TaskTemplate: ${templateDto.id}`);
                
                const newSubtaskTemplate = this.taskTemplateRepository.create({
                  name: subtaskDto.name,
                  description: subtaskDto.description,
                  budgetedHours: subtaskDto.budgetedHours || 0,
                  rank: subtaskDto.rank || 0,
                  taskType: 'task',
                  group: { id: taskGroup.id },
                  parentTask: { id: templateDto.id }
                });
                
                const savedSubtaskTemplate = await this.taskTemplateRepository.save(newSubtaskTemplate);
                console.log(`Created new SubtaskTemplate with ID: ${savedSubtaskTemplate.id}`);
                
                // Update the DTO ID for reference
                subtaskDto.id = savedSubtaskTemplate.id;
              }
              
              // Create subtask
              const subtaskProject = {
                name: subtaskDto.name,
                description: subtaskDto.description || '',
                budgetedHours: subtaskDto.budgetedHours || 0,
                rank: subtaskDto.rank || 0,
                project: { id: projectId },
                groupProject: { id: taskGroupProject.id },
                taskType: 'task' as 'story' | 'task',
                status: 'open' as 'open' | 'in_progress' | 'done',
                parentTask: { id: taskMap.get(templateDto.id).id }
              };
              
              const savedSubtask = await queryRunner.manager.save(Task, subtaskProject);
              console.log(`Created subtask: ${savedSubtask.name} (${savedSubtask.id}) for parent task: ${taskMap.get(templateDto.id).name}`);
            }
          }
        }
      }
      
      // Commit the transaction
      await queryRunner.commitTransaction();
      
      return {
        success: true,
        message: 'Tasks added to project successfully using hierarchical format',
        taskSuperProjectIds: Array.from(taskSuperProjectMap.values()).map(tsp => tsp.id),
      };
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      
      // Enhanced error handling with more context
      console.error('Error adding tasks to project (hierarchical format):', error);
      
      // Format a more helpful error message based on the type of error
      let errorMessage = error.message;
      
      // Handle foreign key constraint violations specifically
      if (error.message.includes('foreign key constraint')) {
        errorMessage = `Foreign key constraint error: ${error.message}. This typically means a parent-child relationship is invalid.`;
      }
      
      throw new BadRequestException('Failed to add tasks to project (hierarchical format): ' + errorMessage);
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }
}