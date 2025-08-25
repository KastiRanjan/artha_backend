import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';

@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  create(@Body() createLeaveDto: CreateLeaveDto) {
    return this.leaveService.create(createLeaveDto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.leaveService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeaveDto: UpdateLeaveDto) {
    return this.leaveService.update(id, updateLeaveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveService.remove(id);
  }

  // Approval endpoints
  @Patch(':id/approve/lead')
  approveByLead(@Param('id') id: string, @Body('userId') userId: string) {
    return this.leaveService.approveByLead(id, userId);
  }

  @Patch(':id/approve/pm')
  approveByPM(@Param('id') id: string, @Body('userId') userId: string) {
    return this.leaveService.approveByPM(id, userId);
  }

  @Patch(':id/approve/admin')
  approveByAdmin(@Param('id') id: string, @Body('userId') userId: string) {
    return this.leaveService.approveByAdmin(id, userId);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body('userId') userId: string) {
    return this.leaveService.reject(id, userId);
  }

  // Calendar view
  @Get('calendar/view')
  calendarView(@Query('from') from: string, @Query('to') to: string, @Query('projectId') projectId?: string) {
    return this.leaveService.calendarView(from, to, projectId);
  }
}
