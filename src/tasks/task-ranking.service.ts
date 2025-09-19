import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskSuperProject } from '../task-super/entities/task-super-project.entity';
import { TaskGroupProject } from '../task-groups/entities/task-group-project.entity';

@Injectable()
export class TaskRankingService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskSuperProject)
    private taskSuperProjectRepository: Repository<TaskSuperProject>,
    @InjectRepository(TaskGroupProject)
    private taskGroupProjectRepository: Repository<TaskGroupProject>,
  ) {}

  async getTaskRankings(projectId: string) {
    // Get TaskSuperProject entities for this project
    const taskSuperProjects = await this.taskSuperProjectRepository.createQueryBuilder('tsp')
      .where('tsp.projectId = :projectId', { projectId })
      .select([
        'tsp.id',
        'tsp.name',
        'tsp.description',
        'tsp.rank'
      ])
      .orderBy('tsp.rank', 'ASC')
      .getMany();

    // Get TaskGroupProject entities for this project
    const taskGroupProjects = await this.taskGroupProjectRepository.createQueryBuilder('tgp')
      .where('tgp.projectId = :projectId', { projectId })
      .select([
        'tgp.id',
        'tgp.name',
        'tgp.description',
        'tgp.rank',
        'tgp.taskSuperId'
      ])
      .orderBy('tgp.rank', 'ASC')
      .getMany();

    // Get tasks for this project - with separate queries to avoid NaN issues
    // First, get all tasks for the project without attempting to join parentTask
    const baseTasks = await this.taskRepository.createQueryBuilder('task')
      .leftJoin('task.groupProject', 'groupProject')
      .where('task.project.id = :projectId', { projectId })
      .select([
        'task.id', 
        'task.name', 
        'task.taskType', 
        'task.rank', 
        'task.budgetedHours',
        'task.parentTaskId'
      ])
      .addSelect(['groupProject.id', 'groupProject.taskSuperId'])
      .orderBy('task.rank', 'ASC')
      .getMany();
    
    // Manually process the tasks to add the parentTask property safely
    const tasks = baseTasks.map(task => {
      // Only include parentTask if parentTaskId exists and is valid
      const parentTaskId = task['parentTaskId'];
      
      // Create a clean object without parentTaskId property
      const { parentTaskId: _, ...cleanTask } = task as any;
      
      // If there's a valid parentTaskId, add a properly structured parentTask object
      if (parentTaskId && typeof parentTaskId === 'string' && parentTaskId.trim() !== '') {
        return {
          ...cleanTask,
          parentTask: { id: parentTaskId }
        };
      }
      
      // Otherwise, just return the task without a parentTask property
      return cleanTask;
    });

    return {
      taskSuperProjects,
      taskGroupProjects,
      tasks
    };
  }

  async updateTaskRankings(
    projectId: string,
    rankings: { taskId: string; rank: number }[],
  ) {
    // Validate UUID format to prevent 'invalid input syntax for type uuid' errors
    const isValidUUID = (id: any): boolean => {
      if (!id || typeof id !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    };

    // Filter out any invalid UUIDs
    if (!isValidUUID(projectId)) {
      return { success: false, message: 'Invalid project ID format' };
    }

    // Only process valid taskIds
    const validRankings = rankings.filter(({ taskId }) => isValidUUID(taskId));
    
    if (validRankings.length === 0) {
      return { success: false, message: 'No valid task IDs to update' };
    }
    
    // Update each task's rank
    const updatePromises = validRankings.map(({ taskId, rank }) => {
      return this.taskRepository.createQueryBuilder()
        .update(Task)
        .set({ rank })
        .where('id = :taskId AND project.id = :projectId', { taskId, projectId })
        .execute();
    });

    await Promise.all(updatePromises);

    return { success: true, message: 'Task rankings updated successfully' };
  }
  
  async updateTaskSuperProjectRankings(
    projectId: string,
    rankings: { taskSuperProjectId: string; rank: number }[],
  ) {
    // Validate UUID format to prevent 'invalid input syntax for type uuid' errors
    const isValidUUID = (id: any): boolean => {
      if (!id || typeof id !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    };

    // Filter out any invalid UUIDs
    if (!isValidUUID(projectId)) {
      return { success: false, message: 'Invalid project ID format' };
    }

    // Only process valid taskSuperProjectIds
    const validRankings = rankings.filter(({ taskSuperProjectId }) => isValidUUID(taskSuperProjectId));
    
    if (validRankings.length === 0) {
      return { success: false, message: 'No valid task super project IDs to update' };
    }
    
    // Update each TaskSuperProject rank
    const updatePromises = validRankings.map(({ taskSuperProjectId, rank }) => {
      return this.taskSuperProjectRepository.createQueryBuilder()
        .update(TaskSuperProject)
        .set({ rank })
        .where('id = :taskSuperProjectId AND projectId = :projectId', { taskSuperProjectId, projectId })
        .execute();
    });

    await Promise.all(updatePromises);

    return { success: true, message: 'TaskSuperProject rankings updated successfully' };
  }
  
  async updateTaskGroupProjectRankings(
    projectId: string,
    rankings: { taskGroupProjectId: string; rank: number }[],
  ) {
    // Validate UUID format to prevent 'invalid input syntax for type uuid' errors
    const isValidUUID = (id: any): boolean => {
      if (!id || typeof id !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    };

    // Filter out any invalid UUIDs
    if (!isValidUUID(projectId)) {
      return { success: false, message: 'Invalid project ID format' };
    }

    // Only process valid taskGroupProjectIds
    const validRankings = rankings.filter(({ taskGroupProjectId }) => isValidUUID(taskGroupProjectId));
    
    if (validRankings.length === 0) {
      return { success: false, message: 'No valid task group project IDs to update' };
    }
    
    // Update each TaskGroupProject rank
    const updatePromises = validRankings.map(({ taskGroupProjectId, rank }) => {
      return this.taskGroupProjectRepository.createQueryBuilder()
        .update(TaskGroupProject)
        .set({ rank })
        .where('id = :taskGroupProjectId AND projectId = :projectId', { taskGroupProjectId, projectId })
        .execute();
    });

    await Promise.all(updatePromises);

    return { success: true, message: 'TaskGroupProject rankings updated successfully' };
  }
}