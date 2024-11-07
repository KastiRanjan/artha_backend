import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { ImportTaskDto } from './dto/import-task.dto';

@ApiTags('tasks')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('tasks')
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }
  @Post('/add-bulk')
  addBulk(@Body() importTaskDto: ImportTaskDto) {
    return this.tasksService.addBulk(importTaskDto);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
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
  findOneByProjectIdAndTaskId(@Param('pid') projectId: string, @Param('tid') taskId: string) {
    return this.tasksService.findOneByProjectIdAndTaskId(projectId, taskId);
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
