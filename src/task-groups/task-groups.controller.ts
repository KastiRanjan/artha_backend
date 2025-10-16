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
import { TaskGroupsService } from './task-groups.service';
import { UpdateTaskGroupDto } from './dto/update-task-group.dto';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateTaskGroupDto } from './dto/create-task-group.dto';
@ApiTags('task-group')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('task-group')
@ApiBearerAuth()
export class TaskGroupsController {
  constructor(private readonly taskGroupsService: TaskGroupsService) {}

  @Post()
  create(@Body() createTaskGroupDto: CreateTaskGroupDto) {
    return this.taskGroupsService.create(createTaskGroupDto);
  }

  @Get()
  @ApiQuery({ name: 'taskSuperId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  findAll(
    @Query('taskSuperId') taskSuperId?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number
  ) {
    return this.taskGroupsService.findAll(taskSuperId, limit, page);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskGroupsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskGroupDto: UpdateTaskGroupDto
  ) {
    return this.taskGroupsService.update(id, updateTaskGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskGroupsService.remove(id);
  }
}
