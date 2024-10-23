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
import { TaskGroupsService } from './task-groups.service';
import { UpdateTaskGroupDto } from './dto/update-task-group.dto';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  findAll() {
    return this.taskGroupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskGroupsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskGroupDto: UpdateTaskGroupDto
  ) {
    return this.taskGroupsService.update(+id, updateTaskGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskGroupsService.remove(+id);
  }
}
