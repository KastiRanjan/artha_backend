import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { WorkhourService } from './workhour.service';
import { CreateWorkhourDto } from './dto/create-workhour.dto';
import { UpdateWorkhourDto } from './dto/update-workhour.dto';

@Controller('workhour')
export class WorkhourController {
  constructor(private readonly workhourService: WorkhourService) {}

  @Post()
  create(@Body() createWorkhourDto: CreateWorkhourDto) {
    return this.workhourService.create(createWorkhourDto);
  }

  @Get()
  findAll(@Query('role') role?: string, @Query('userId') userId?: string) {
    return this.workhourService.findAll(role, userId);
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

  // Get resolved work hours for a user (role default or override)
  @Get('resolve/:userId')
  resolveForUser(@Param('userId') userId: string, @Query('role') role?: string) {
    return this.workhourService.resolveForUser(userId, role);
  }
}
