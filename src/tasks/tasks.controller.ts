import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { ImportTaskDto } from './dto/import-task.dto';
import { ImportTaskTemplateDto } from './dto/import-taskTemplate.dto';
import { BulkUpdateTaskDto } from './dto/bulk-update-task.dto';
import { MarkCompleteTaskDto } from './dto/mark-complete-task.dto';
import { FirstVerifyTaskDto } from './dto/first-verify-task.dto';
import { SecondVerifyTaskDto } from './dto/second-verify-task.dto';

@ApiTags('tasks')
@UseGuards(JwtTwoFactorGuard)
@Controller('tasks')
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }
  @Post('/add-bulk')
  addBulk(@Body() importTaskDto: ImportTaskDto) {
    return this.tasksService.addBulk(importTaskDto);
  }

  @Post('/add-bulk-list')
  addBulkList(@Body() importTaskTemplateDto: ImportTaskTemplateDto) {
    return this.tasksService.addBulkList(importTaskTemplateDto);
  }

  @Get()
  findAll(@Query('status') status: 'open' | 'in_progress' | 'done') {
    return this.tasksService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }
  @Get('project/:id')
  findOneByProjectId(@Param('id') id: string) {
    return this.tasksService.findOneByProjectId(id);
  }
  @Get(':tid/project/:pid')
  findOneByProjectIdAndTaskId(
    @Param('pid') projectId: string,
    @Param('tid') taskId: string
  ) {
    return this.tasksService.findOneByProjectIdAndTaskId(projectId, taskId);
  }

  @Get('project/:pid/user/:uid')
  findTasksByProjectIdAndUserId(
    @Param('pid') projectId: string,
    @Param('uid') userId: string
  ) {
    return this.tasksService.findTasksByProjectIdAndUserId(projectId, userId);
  }

  @Patch('/bulk-update')
  bulkUpdate(@Body() bulkUpdateTaskDto: BulkUpdateTaskDto) {
    return this.tasksService.bulkUpdate(bulkUpdateTaskDto);
  }

  @Patch('/mark-complete')
  markComplete(@Body() markCompleteTaskDto: MarkCompleteTaskDto) {
    return this.tasksService.markTasksComplete(markCompleteTaskDto);
  }

  @Patch('/first-verify')
  firstVerify(@Body() firstVerifyTaskDto: FirstVerifyTaskDto) {
    return this.tasksService.firstVerifyTasks(firstVerifyTaskDto);
  }

  @Patch('/second-verify')
  secondVerify(@Body() secondVerifyTaskDto: SecondVerifyTaskDto) {
    return this.tasksService.secondVerifyTasks(secondVerifyTaskDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
