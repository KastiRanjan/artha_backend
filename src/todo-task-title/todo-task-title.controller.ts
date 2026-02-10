import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TodoTaskTitleService } from './todo-task-title.service';
import { CreateTodoTaskTitleDto } from './dto/create-todo-task-title.dto';
import { UpdateTodoTaskTitleDto } from './dto/update-todo-task-title.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';

@ApiTags('todo-task-title')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('todo-task-title')
@ApiBearerAuth()
export class TodoTaskTitleController {
  constructor(private readonly todoTaskTitleService: TodoTaskTitleService) {}

  @Post()
  create(@Body() createDto: CreateTodoTaskTitleDto) {
    return this.todoTaskTitleService.create(createDto);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly: boolean = false) {
    return this.todoTaskTitleService.findAll(activeOnly);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todoTaskTitleService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTodoTaskTitleDto,
  ) {
    return this.todoTaskTitleService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.todoTaskTitleService.remove(id);
  }
}
