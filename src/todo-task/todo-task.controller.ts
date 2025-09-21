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
import { TodoTaskService } from './todo-task.service';
import { CreateTodoTaskDto } from './dto/create-todo-task.dto';
import { UpdateTodoTaskDto } from './dto/update-todo-task.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { TodoTask, TodoTaskStatus } from './entities/todo-task.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@ApiTags('todo-task')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('todo-task')
@ApiBearerAuth()
export class TodoTaskController {
  constructor(private readonly todoTaskService: TodoTaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new todo task' })
  create(
    @GetUser() user: UserEntity,
    @Body() createTodoTaskDto: CreateTodoTaskDto
  ): Promise<TodoTask> {
    return this.todoTaskService.create(createTodoTaskDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todo tasks (or tasks assigned to current user if no view-all permission)' })
  @ApiQuery({ name: 'status', enum: TodoTaskStatus, required: false })
  @ApiQuery({ name: 'assignedToId', required: false })
  findAll(
    @GetUser() user: UserEntity,
    @Query('status') status?: TodoTaskStatus,
    @Query('assignedToId') assignedToId?: string,
  ): Promise<TodoTask[]> {
    return this.todoTaskService.findAll(user, status, assignedToId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get todo tasks by status' })
  @ApiParam({ name: 'status', enum: TodoTaskStatus })
  findByStatus(
    @GetUser() user: UserEntity,
    @Param('status') status: TodoTaskStatus,
  ): Promise<TodoTask[]> {
    return this.todoTaskService.findAllByStatus(status, user);
  }

  @Get('assigned/:userId')
  @ApiOperation({ summary: 'Get todo tasks assigned to a specific user' })
  @ApiQuery({ name: 'status', enum: TodoTaskStatus, required: false })
  findByAssignedUser(
    @GetUser() user: UserEntity,
    @Param('userId') userId: string,
    @Query('status') status?: TodoTaskStatus,
  ): Promise<TodoTask[]> {
    return this.todoTaskService.findByAssignedUser(userId, user, status);
  }

  @Get('created/:userId')
  @ApiOperation({ summary: 'Get todo tasks created by a specific user' })
  @ApiQuery({ name: 'status', enum: TodoTaskStatus, required: false })
  findByCreatedUser(
    @GetUser() user: UserEntity,
    @Param('userId') userId: string,
    @Query('status') status?: TodoTaskStatus,
  ): Promise<TodoTask[]> {
    return this.todoTaskService.findByCreatedUser(userId, user, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a todo task by ID' })
  findOne(
    @GetUser() user: UserEntity,
    @Param('id') id: string
  ): Promise<TodoTask> {
    return this.todoTaskService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo task' })
  update(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() updateTodoTaskDto: UpdateTodoTaskDto
  ): Promise<TodoTask> {
    return this.todoTaskService.update(id, updateTodoTaskDto, user);
  }

  @Patch(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a todo task' })
  acknowledge(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() updateTodoTaskDto: UpdateTodoTaskDto
  ): Promise<TodoTask> {
    return this.todoTaskService.acknowledge(id, updateTodoTaskDto, user);
  }

  @Patch(':id/pending')
  @ApiOperation({ summary: 'Mark a todo task as pending' })
  setPending(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() updateTodoTaskDto: UpdateTodoTaskDto
  ): Promise<TodoTask> {
    return this.todoTaskService.setPending(id, updateTodoTaskDto, user);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a todo task' })
  complete(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() updateTodoTaskDto: UpdateTodoTaskDto
  ): Promise<TodoTask> {
    return this.todoTaskService.complete(id, updateTodoTaskDto, user);
  }

  @Patch(':id/drop')
  @ApiOperation({ summary: 'Drop a todo task' })
  drop(
    @GetUser() user: UserEntity,
    @Param('id') id: string,
    @Body() updateTodoTaskDto: UpdateTodoTaskDto
  ): Promise<TodoTask> {
    return this.todoTaskService.drop(id, updateTodoTaskDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a todo task' })
  remove(
    @GetUser() user: UserEntity,
    @Param('id') id: string
  ): Promise<void> {
    return this.todoTaskService.remove(id, user);
  }
}