import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseFilters
} from '@nestjs/common';
import { TaskSuperService } from './task-super.service';
import { CreateTaskSuperDto } from './dto/create-task-super.dto';
import { UpdateTaskSuperDto } from './dto/update-task-super.dto';
import { AddToProjectDto, AddToProjectNewFormatDto } from './dto/add-to-project.dto';
import { HierarchicalProjectAssignDto } from './dto/hierarchical-project-assign.dto';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { Permissions } from 'src/permission/decorators/permissions.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ValidationExceptionFilter } from 'src/common/exception/validation-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { TaskSuperRankingDto } from './dto/task-super-ranking.dto';

@ApiTags('task-super')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@UseFilters(ValidationExceptionFilter)
@Controller('task-super')
@ApiBearerAuth()
export class TaskSuperController {
  constructor(private readonly taskSuperService: TaskSuperService) {}

  @Post()
  create(@Body() createTaskSuperDto: CreateTaskSuperDto) {
    return this.taskSuperService.create(createTaskSuperDto);
  }

  @Get()
  findAll() {
    return this.taskSuperService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskSuperService.findOne(id);
  }

  @Patch('rankings')
  updateGlobalRankings(
    @Body() rankings: TaskSuperRankingDto[]
  ) {
    return this.taskSuperService.updateGlobalRankings(rankings);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskSuperDto: UpdateTaskSuperDto,
  ) {
    return this.taskSuperService.update(id, updateTaskSuperDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskSuperService.remove(id);
  }

  @Post('add-to-project')
  addToProject(@Body() addToProjectDto: AddToProjectDto | AddToProjectNewFormatDto | HierarchicalProjectAssignDto) {
    // Check for hierarchical format
    if ('taskSupers' in addToProjectDto && Array.isArray(addToProjectDto.taskSupers)) {
      return this.taskSuperService.addToProjectHierarchical(addToProjectDto as HierarchicalProjectAssignDto);
    }
    // Check if it's the new format (has items array)
    else if ('items' in addToProjectDto) {
      return this.taskSuperService.addToProjectNewFormat(addToProjectDto as AddToProjectNewFormatDto);
    }
    // Use the original format
    return this.taskSuperService.addToProject(addToProjectDto as AddToProjectDto);
  }
}