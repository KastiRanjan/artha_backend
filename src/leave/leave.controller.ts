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
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { AllocateLeaveDto } from './dto/allocate-leave.dto';
import { CarryOverLeaveDto } from './dto/carry-over-leave.dto';
import { RequestClarificationDto } from './dto/request-clarification.dto';
import { RespondClarificationDto } from './dto/respond-clarification.dto';
import { LeaveService } from './leave.service';
import { UserLeaveBalanceService } from './user-leave-balance.service';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
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
    private readonly userLeaveBalanceService: UserLeaveBalanceService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Apply for leave (supports fractional & full day)' })
  create(@Body() createLeaveDto: CreateLeaveDto, @GetUser() user: UserEntity) {
    return this.leaveService.create(createLeaveDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Find all leaves with optional status filter' })
  findAll(@Query('status') status?: string) {
    return this.leaveService.findAll(status);
  }

  // Static routes must be declared before parameterized (':id') routes.
  @Get('approvals/pending')
  @ApiOperation({ summary: 'Get leaves waiting for current user approval' })
  getPendingApprovals(@GetUser() user: UserEntity) {
    return this.leaveService.getLeavesForApproval(user.id);
  }

  @Get('my-leaves')
  @ApiOperation({ summary: 'Get current user leaves' })
  getMyLeaves(@GetUser() user: UserEntity, @Query('status') status?: string) {
    if (!user?.id) throw new BadRequestException('User not authenticated');
    return this.leaveService.getUserLeaves(user.id, status);
  }

  @Get('calendar/view')
  @ApiOperation({ summary: 'Calendar view of leaves' })
  calendarView(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.leaveService.calendarView(from, to, projectId);
  }

  // ---- balance & ledger ----
  @Get('balance/my')
  @ApiOperation({ summary: 'Get current user leave balance' })
  getMyLeaveBalances(@GetUser() user: UserEntity, @Query('year') year?: number) {
    return this.leaveService.getAllLeaveBalances(user.id, year);
  }

  @Get('balance/ledger/my')
  @ApiOperation({ summary: 'Get audit ledger for current user' })
  getMyLeaveLedger(
    @GetUser() user: UserEntity,
    @Query('year') year?: number,
    @Query('leaveTypeId') leaveTypeId?: string,
  ) {
    return this.userLeaveBalanceService.getLedgerEntries(user.id, year, leaveTypeId);
  }

  @Get('balance/ledger/:userId')
  @ApiOperation({ summary: 'Get audit ledger for specific user (privileged role or owner)' })
  getUserLeaveLedger(
    @Param('userId') userId: string,
    @GetUser() user: UserEntity,
    @Query('year') year?: number,
    @Query('leaveTypeId') leaveTypeId?: string,
  ) {
    const roleName = user.role?.name?.toLowerCase();
    const isPrivileged = [
      'admin',
      'administrator',
      'superuser',
      'manager',
      'projectmanager',
    ].includes(roleName);

    if (user.id !== userId && !isPrivileged) {
      throw new ForbiddenException("You are not allowed to view this user's leave ledger");
    }

    return this.userLeaveBalanceService.getLedgerEntries(userId, year, leaveTypeId);
  }

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get leave balances for a specific user' })
  getUserLeaveBalances(
    @Param('userId') userId: string,
    @GetUser() user: UserEntity,
    @Query('year') year?: number,
  ) {
    return this.leaveService.getAllLeaveBalances(userId, year, user);
  }

  @Get('balance/:userId/:leaveType')
  @ApiOperation({ summary: 'Get specific leave type balance for a user' })
  getSpecificLeaveBalance(
    @Param('userId') userId: string,
    @Param('leaveType') leaveType: string,
    @GetUser() user: UserEntity,
    @Query('year') year?: number,
  ) {
    return this.leaveService.getLeaveBalance(userId, leaveType, year, user);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get leaves of a user' })
  getUserLeaves(
    @Param('userId') userId: string,
    @GetUser() user: UserEntity,
    @Query('status') status?: string,
  ) {
    return this.leaveService.getUserLeaves(userId, status, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single leave record by ID' })
  findOne(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.leaveService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a leave request' })
  update(
    @Param('id') id: string,
    @Body() updateLeaveDto: UpdateLeaveDto,
    @GetUser() user: UserEntity,
  ) {
    return this.leaveService.update(id, updateLeaveDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/delete a leave request' })
  remove(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.leaveService.remove(id, user);
  }

  // ---- Clarification workflow ----
  @Patch(':id/clarification/request')
  @ApiOperation({ summary: 'Request clarification from leave applicant' })
  requestClarification(
    @Param('id') id: string,
    @Body() dto: RequestClarificationDto,
    @GetUser() user: UserEntity,
  ) {
    return this.leaveService.requestClarification(id, user.id, dto.notes);
  }

  @Patch(':id/clarification/respond')
  @ApiOperation({ summary: 'Applicant responds to clarification request' })
  respondClarification(
    @Param('id') id: string,
    @Body() dto: RespondClarificationDto,
    @GetUser() user: UserEntity,
  ) {
    return this.leaveService.respondToClarification(id, user.id, dto.response);
  }

  // ---- Approval endpoints ----
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Role-aware leave approval' })
  approve(
    @Param('id') id: string,
    @Body() body: { notifyAdmins?: string[] },
    @GetUser() user: UserEntity,
  ) {
    if (!user?.id) throw new BadRequestException('User not authenticated');
    return this.leaveService.approve(id, user.id, body?.notifyAdmins);
  }

  /** @deprecated use PATCH :id/approve */
  @Patch(':id/approve/manager')
  approveByManager(
    @Param('id') id: string,
    @Body() body: { notifyAdmins?: string[] },
    @GetUser() user: UserEntity,
  ) {
    return this.leaveService.approve(id, user.id, body?.notifyAdmins);
  }

  /** @deprecated use PATCH :id/approve */
  @Patch(':id/approve/pm')
  approveByPM(
    @Param('id') id: string,
    @Body() body: { notifyAdmins?: string[] },
    @GetUser() user: UserEntity,
  ) {
    return this.leaveService.approve(id, user.id, body?.notifyAdmins);
  }

  /** @deprecated */
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
  @ApiOperation({ summary: 'Reject leave request' })
  reject(@Param('id') id: string, @GetUser() user: UserEntity) {
    if (!user?.id) throw new BadRequestException('User not authenticated');
    return this.leaveService.reject(id, user.id);
  }

  // ---- Balance management (admin) ----
  @Post('balance/allocate')
  @ApiOperation({ summary: 'Allocate leave quota to single user' })
  allocateLeave(@Body() allocateLeaveDto: AllocateLeaveDto, @GetUser() user: UserEntity) {
    return this.userLeaveBalanceService.allocateLeave(allocateLeaveDto, user?.id);
  }

  @Post('balance/allocate-all')
  @ApiOperation({ summary: 'Allocate leave quota to all active users' })
  allocateLeaveToAllUsers(
    @Body() body: { leaveTypeId: string; year: number; allocatedDays: number },
    @GetUser() user: UserEntity,
  ) {
    return this.userLeaveBalanceService.allocateLeaveToAllUsers(
      body.leaveTypeId,
      body.year,
      body.allocatedDays,
      user?.id,
    );
  }

  @Post('balance/carry-over')
  @ApiOperation({ summary: 'Execute year-end leave carry over' })
  carryOverLeave(@Body() carryOverDto: CarryOverLeaveDto, @GetUser() user: UserEntity) {
    return this.userLeaveBalanceService.carryOverLeave(carryOverDto, user?.id);
  }

  @Get('balance/user/:userId/year/:year')
  @ApiOperation({ summary: 'Get user leave balances by year' })
  getUserLeaveBalancesByYear(
    @Param('userId') userId: string,
    @Param('year') year: number,
    @GetUser() user: UserEntity,
  ) {
    return this.userLeaveBalanceService.getUserAllLeaveBalances(userId, year);
  }
}
