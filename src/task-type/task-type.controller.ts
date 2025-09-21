import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TaskTypeService } from './task-type.service';
import { CreateTaskTypeDto } from './dto/create-task-type.dto';
import { UpdateTaskTypeDto } from './dto/update-task-type.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';

@ApiTags('task-type')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('task-type')
@ApiBearerAuth()
export class TaskTypeController {
  constructor(private readonly taskTypeService: TaskTypeService) {}

  @Post()
  create(@Body() createTaskTypeDto: CreateTaskTypeDto) {
    return this.taskTypeService.create(createTaskTypeDto);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly: boolean = false) {
    return this.taskTypeService.findAll(activeOnly);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskTypeService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskTypeDto: UpdateTaskTypeDto,
  ) {
    return this.taskTypeService.update(id, updateTaskTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskTypeService.remove(id);
  }
}