import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorklogsService } from './worklogs.service';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { UpdateWorklogDto } from './dto/update-worklog.dto';

@Controller('worklogs')
export class WorklogsController {
  constructor(private readonly worklogsService: WorklogsService) {}

  @Post()
  create(@Body() createWorklogDto: CreateWorklogDto) {
    return this.worklogsService.create(createWorklogDto);
  }

  @Get()
  findAll() {
    return this.worklogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.worklogsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorklogDto: UpdateWorklogDto) {
    return this.worklogsService.update(+id, updateWorklogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.worklogsService.remove(+id);
  }
}
