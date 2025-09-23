import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { CreateWorkhourDto } from './dto/create-workhour.dto';
import { UpdateWorkhourDto } from './dto/update-workhour.dto';
import { WorkhourService } from './workhour.service';

@Controller('workhour')
export class WorkhourController {
  constructor(private readonly workhourService: WorkhourService) {}

  @Post()
  create(@Body() createWorkhourDto: CreateWorkhourDto) {
    return this.workhourService.create(createWorkhourDto);
  }

  @Get()
  findAll(@Query('roleId') roleId?: string) {
    return this.workhourService.findAll(roleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workhourService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkhourDto: UpdateWorkhourDto) {
    return this.workhourService.update(id, updateWorkhourDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workhourService.remove(id);
  }

  // Get resolved work hours for a user (based on role)
  @Get('resolve/:userId')
  resolveForUser(@Param('userId') userId: string, @Query('roleId') roleId?: string) {
    return this.workhourService.resolveForUser(userId, roleId);
  }
  
  // Get workhour history for a role
  @Get('history/:roleId')
  getWorkhourHistory(@Param('roleId') roleId: string) {
    return this.workhourService.getWorkhourHistory(roleId);
  }
}
