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

import { UpdateWorklogDto } from './dto/update-worklog.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { WorklogService } from './worklog.service';

@ApiTags('worklog')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('worklogs')
@ApiBearerAuth()
export class WorklogController {
  constructor(private readonly worklogService: WorklogService) {}

  @Post()
  create(@Body() createWorklogDto: CreateWorklogDto) {
    return this.worklogService.create(createWorklogDto);
  }

  @Get()
  findAll() {
    return this.worklogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.worklogService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateWorklogDto) {
    return this.worklogService.update(id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.worklogService.remove(id);
  }
}
