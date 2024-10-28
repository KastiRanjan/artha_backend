import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TaskTemplateService } from './task-template.service';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskTemplateDto } from './dto/update-task-template.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';

@ApiTags('task-template')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('task-template')
@ApiBearerAuth()
export class TaskTemplateController {
  constructor(private readonly taskTemplateService: TaskTemplateService) {}

  @Post()
  create(@Body() createTaskTemplateDto: CreateTaskTemplateDto) {
    return this.taskTemplateService.create(createTaskTemplateDto);
  }

  @Get()
  findAll() {
    return this.taskTemplateService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskTemplateService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskTemplateDto: UpdateTaskTemplateDto) {
    return this.taskTemplateService.update(id, updateTaskTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskTemplateService.remove(id);
  }
}
