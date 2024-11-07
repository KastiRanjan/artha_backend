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
import { CreateWorklogDto, CreateWorklogListDto } from './dto/create-worklog.dto';
import { WorklogService } from './worklog.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';

@ApiTags('worklog')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('worklogs')
@ApiBearerAuth()
export class WorklogController {
  constructor(private readonly worklogService: WorklogService) { }

  @Post()

  create(@GetUser()
  user: UserEntity, @Body() createWorklogDto: any) {
    return this.worklogService.create(createWorklogDto,user);
  }

  @Get()
  findAll() {
    return this.worklogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.worklogService.findOne(id);
  }

  @Get('task/:id')
  findByTaskId(@Param('id') id: string) {
    return this.worklogService.findByTaskId(id);
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
