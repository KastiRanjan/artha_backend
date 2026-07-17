import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { AllocateLeaveDto } from './dto/allocate-leave.dto';
import { CarryOverLeaveDto } from './dto/carry-over-leave.dto';
import { LeaveService } from './leave.service';
import { UserLeaveBalanceService } from './user-leave-balance.service';
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
  constructor(
    private readonly leaveService: LeaveService,
    private readonly userLeaveBalanceService: UserLeaveBalanceService
  ) {}

  @Post()
  create(@Body() createLeaveDto: CreateLeaveDto, @GetUser() user: UserEntity) {
    return this.leaveService.create(createLeaveDto, user);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.leaveService.findAll(status);
  }

  // Static routes must be declared before parameterized (':id') routes.
  @Get('approvals/pending')
  getPendingApprovals(@GetUser() user: UserEntity) {
    return this.leaveService.getLeavesForApproval(user.id);
  }

  @Get('my-leaves')
  getMyLeaves(@GetUser() user: UserEntity, @Query('status') status?: string) {
    if (!user?.id) throw new BadRequestException('User not authenticated');
    // A user's own leaves — no ownership check needed, id comes from the token.
    return this.leaveService.getUserLeaves(user.id, status);
  }

  @Get('calendar/view')
  calendarView(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('projectId') projectId?: string
  ) {
    return this.leaveService.calendarView(from, to, projectId);
  }

  // ---- balance ----
  @Get('balance/my')
  getMyLeaveBalances(@GetUser() user: UserEntity, @Query('year') year?: number) {
    return this.leaveService.getAllLeaveBalances(user.id, year);
  }

  @Get('balance/:userId')
  getUserLeaveBalances(
    @Param('userId') userId: string,
    @GetUser() user: UserEntity,
    @Query('year') year?: number
  ) {
    // Only the owner or a privileged role may read someone else's balance.
    return this.leaveService.getAllLeaveBalances(userId, year, user);
  }

  @Get('balance/:userId/:leaveType')
  getSpecificLeaveBalance(
    @Param('userId') userId: string,
    @Param('leaveType') leaveType: string,
    @GetUser() user: UserEntity,
    @Query('year') year?: number
  ) {
    return this.leaveService.getLeaveBalance(userId, leaveType, year, user);
  }

  @Get('user/:userId')
  getUserLeaves(
    @Param('userId') userId: string,
    @GetUser() user: UserEntity,
    @Query('status') status?: string
  ) {
    return this.leaveService.getUserLeaves(userId, status, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.leaveService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLeaveDto: UpdateLeaveDto,
    @GetUser() user: UserEntity
  ) {
    return this.leaveService.update(id, updateLeaveDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.leaveService.remove(id, user);
  }

  // ---- approval ----
  // SECURITY: the approver is ALWAYS derived from the authenticated token
  // (never from the request body). Every endpoint delegates to the single
  // role-aware `approve()` method, which enforces who is allowed to approve.

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: { notifyAdmins?: string[] },
    @GetUser() user: UserEntity
  ) {
    if (!user?.id) throw new BadRequestException('User not authenticated');
    return this.leaveService.approve(id, user.id, body?.notifyAdmins);
  }

  /** @deprecated use PATCH :id/approve — kept for old clients, now secured */
  @Patch(':id/approve/manager')
  approveByManager(
    @Param('id') id: string,
    @Body() body: { notifyAdmins?: string[] },
    @GetUser() user: UserEntity
  ) {
    return this.leaveService.approve(id, user.id, body?.notifyAdmins);
  }

  /** @deprecated use PATCH :id/approve */
  @Patch(':id/approve/pm')
  approveByPM(
    @Param('id') id: string,
    @Body() body: { notifyAdmins?: string[] },
    @GetUser() user: UserEntity
  ) {
    return this.leaveService.approve(id, user.id, body?.notifyAdmins);
  }

  /** @deprecated team-lead step removed */
  @Patch(':id/approve/lead')
  approveByLead(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.leaveService.approve(id, user.id);
  }

  /** @deprecated use PATCH :id/approve */
  @Patch(':id/approve/admin')
  approveByAdmin(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.leaveService.approve(id, user.id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @GetUser() user: UserEntity) {
    if (!user?.id) throw new BadRequestException('User not authenticated');
    return this.leaveService.reject(id, user.id);
  }

  // ---- balance management (admin) ----
  @Post('balance/allocate')
  allocateLeave(@Body() allocateLeaveDto: AllocateLeaveDto) {
    return this.userLeaveBalanceService.allocateLeave(allocateLeaveDto);
  }

  @Post('balance/allocate-all')
  allocateLeaveToAllUsers(
    @Body() body: { leaveTypeId: string; year: number; allocatedDays: number }
  ) {
    return this.userLeaveBalanceService.allocateLeaveToAllUsers(
      body.leaveTypeId,
      body.year,
      body.allocatedDays
    );
  }

  @Post('balance/carry-over')
  carryOverLeave(@Body() carryOverDto: CarryOverLeaveDto) {
    return this.userLeaveBalanceService.carryOverLeave(carryOverDto);
  }

  @Get('balance/user/:userId/year/:year')
  getUserLeaveBalancesByYear(
    @Param('userId') userId: string,
    @Param('year') year: number,
    @GetUser() user: UserEntity
  ) {
    return this.userLeaveBalanceService.getUserAllLeaveBalances(userId, year);
  }
}
