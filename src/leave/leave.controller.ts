import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { LeaveService } from './leave.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';

@ApiTags('leave')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('leave')
@ApiBearerAuth()
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  create(@Body() createLeaveDto: CreateLeaveDto, @GetUser() user: UserEntity) {
    return this.leaveService.create(createLeaveDto, user);
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

  // Leave balance endpoints
  @Get('balance/my')
  getMyLeaveBalances(@GetUser() user: UserEntity, @Query('year') year?: number) {
    return this.leaveService.getAllLeaveBalances(user.id, year);
  }

  @Get('balance/:userId')
  getUserLeaveBalances(@Param('userId') userId: string, @Query('year') year?: number) {
    return this.leaveService.getAllLeaveBalances(userId, year);
  }

  @Get('balance/:userId/:leaveType')
  getSpecificLeaveBalance(
    @Param('userId') userId: string, 
    @Param('leaveType') leaveType: string,
    @Query('year') year?: number
  ) {
    return this.leaveService.getLeaveBalance(userId, leaveType, year);
  }
}
