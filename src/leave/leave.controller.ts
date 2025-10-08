import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards, BadRequestException } from '@nestjs/common';
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

  // New endpoints for enhanced leave management and static routes must be
  // declared before parameterized routes to avoid route collisions (e.g. ':id' matching 'my-leaves').
  @Get('approvals/pending')
  async getPendingApprovals(@GetUser() user: UserEntity) {
    const leaves = await this.leaveService.getLeavesForApproval(user.id);
    
    // Count pending leaves for approval
    const pendingCount = leaves.filter(l => ['pending', 'approved_by_lead', 'approved_by_pm'].includes(l.status)).length;    
    return leaves;
  }

  @Get('my-leaves')
  getMyLeaves(@GetUser() user: UserEntity, @Query('status') status?: string) {
    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.leaveService.getUserLeaves(user.id, status);
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

  // Get leaves for a specific user (used by profile pages and manager views)
  @Get('user/:userId')
  getUserLeaves(@Param('userId') userId: string, @Query('status') status?: string) {
    return this.leaveService.getUserLeaves(userId, status);
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
  /**
   * @deprecated This endpoint is deprecated as team lead approval has been removed
   */
  @Patch(':id/approve/lead')
  approveByLead(@Param('id') id: string, @Body('userId') userId: string) {
    return this.leaveService.approveByLead(id, userId);
  }

  @Patch(':id/approve/manager')
  approveByManager(@Param('id') id: string, @Body() body: { userId?: string; notifyAdmins?: string[] }, @GetUser() user: UserEntity) {
    const userId = body.userId || user.id;
    return this.leaveService.approveByPM(id, userId, body.notifyAdmins);
  }
  
  // Keep for backward compatibility
  @Patch(':id/approve/pm')
  approveByPM(@Param('id') id: string, @Body() body: { userId?: string; notifyAdmins?: string[] }, @GetUser() user: UserEntity) {
    const userId = body.userId || user.id;
    return this.leaveService.approveByPM(id, userId, body.notifyAdmins);
  }

  @Patch(':id/approve/admin')
  approveByAdmin(@Param('id') id: string, @Body('userId') userId: string) {
    return this.leaveService.approveByAdmin(id, userId);
  }

  // Generic approve endpoint that determines approval level based on user role
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() body: { notifyAdmins?: string[] }, @GetUser() user: UserEntity) {
    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.leaveService.approve(id, user.id, body.notifyAdmins);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @GetUser() user: UserEntity) {
    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.leaveService.reject(id, user.id);
  }

  // Override endpoint removed per requirements
  
}
