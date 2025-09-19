import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { TaskRankingService } from './task-ranking.service';
import { UpdateTaskRankingDto } from './dto/update-task-ranking.dto';
import { UpdateTaskSuperRankingDto } from './dto/update-task-super-ranking.dto';
import { UpdateTaskGroupRankingDto } from './dto/update-task-group-ranking.dto';

@Controller('tasks-ranking') // Changed from 'tasks/ranking' to 'tasks-ranking' to avoid UUID parsing issues
@UseGuards(JwtAuthGuard)
export class TaskRankingController {
  constructor(private readonly taskRankingService: TaskRankingService) {}

  @Get()
  async getTaskRankings(@Query('projectId') projectId: string) {
    return this.taskRankingService.getTaskRankings(projectId);
  }

  @Patch()
  async updateTaskRankings(@Body() updateTaskRankingDto: UpdateTaskRankingDto) {
    return this.taskRankingService.updateTaskRankings(
      updateTaskRankingDto.projectId,
      updateTaskRankingDto.rankings
    );
  }
  
  @Patch('task-super')
  async updateTaskSuperRankings(@Body() updateTaskSuperRankingDto: UpdateTaskSuperRankingDto) {
    return this.taskRankingService.updateTaskSuperProjectRankings(
      updateTaskSuperRankingDto.projectId,
      updateTaskSuperRankingDto.rankings
    );
  }
  
  @Patch('task-group')
  async updateTaskGroupRankings(@Body() updateTaskGroupRankingDto: UpdateTaskGroupRankingDto) {
    return this.taskRankingService.updateTaskGroupProjectRankings(
      updateTaskGroupRankingDto.projectId,
      updateTaskGroupRankingDto.rankings
    );
  }
}