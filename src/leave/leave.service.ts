import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leave, LeaveStatus } from './entities/leave.entity';
import { LeaveType } from '../leave-type/entities/leave-type.entity';
import { Holiday } from '../holiday/entities/holiday.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { UserEntity } from '../auth/entity/user.entity';
import { Project } from '../projects/entities/project.entity';
import { NotificationService } from '../notification/notification.service';
import { UserLeaveBalanceService } from './user-leave-balance.service';
import { LeaveLedgerAction } from './entities/leave-balance-ledger.entity';
import * as moment from 'moment';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>,
    @InjectRepository(LeaveType)
    private readonly leaveTypeRepository: Repository<LeaveType>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Holiday)
    private readonly holidayRepository: Repository<Holiday>,
    private readonly notificationService: NotificationService,
    private readonly userLeaveBalanceService: UserLeaveBalanceService,
  ) {}

  private createMoment(dateInput: any): moment.Moment {
    if (!dateInput) {
      console.error('createMoment: No date input provided');
      throw new BadRequestException('Date is required');
    }

    try {
      const m = moment(dateInput);
      if (!m.isValid()) {
        console.error('createMoment: Invalid moment object created from:', dateInput);
        throw new BadRequestException(`Invalid date: ${dateInput}`);
      }
      return m;
    } catch (error) {
      console.error('createMoment error:', error);
      throw new BadRequestException(`Error processing date: ${dateInput}`);
    }
  }

  private generateDateRange(startDate: string, endDate: string): string[] {
    try {
      const start = this.createMoment(startDate);
      const end = this.createMoment(endDate);
      const days: string[] = [];

      const current = start.clone();

      while (current.isSameOrBefore(end)) {
        days.push(current.format('YYYY-MM-DD'));
        current.add(1, 'day');

        // Safety check to prevent infinite loops
        if (days.length > 365) {
          console.error('generateDateRange: Too many days generated, breaking loop');
          throw new BadRequestException('Date range too large');
        }
      }

      return days;
    } catch (error) {
      throw error;
    }
  }

  private validateUUID(id: string, fieldName: string = 'ID'): void {
    if (!id || id.trim() === '' || id === 'undefined' || id === 'null') {
      throw new BadRequestException(`${fieldName} is required`);
    }

    const cleanId = id.toString().trim();

    if (cleanId.includes('"') || cleanId.includes("'") || cleanId.includes(' ')) {
      throw new BadRequestException(`Invalid ${fieldName} format - contains invalid characters`);
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isNumeric = /^\d+$/.test(cleanId);

    if (!uuidRegex.test(cleanId) && !isNumeric) {
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
  }

  /** Roles allowed to view/act on other users' leave records. */
  private static readonly PRIVILEGED_ROLES = [
    'manager',
    'projectmanager',
    'admin',
    'administrator',
    'superuser',
  ];

  private isPrivileged(user?: UserEntity): boolean {
    const role = user?.role?.name?.toLowerCase();
    return !!role && LeaveService.PRIVILEGED_ROLES.includes(role);
  }

  /**
   * Helper to determine exact leave duration in days (accounting for fractional leave)
   */
  public getLeaveDuration(leave: Leave): number {
    if (leave.isFractional) {
      return leave.fractionalDuration ? Number(leave.fractionalDuration) : 0.5;
    }
    if (leave.isCustomDates && leave.customDates?.length) {
      return leave.customDates.length;
    }
    const start = this.createMoment(leave.startDate);
    const end = this.createMoment(leave.endDate);
    return end.diff(start, 'days') + 1;
  }

  private assertCanAccessUser(ownerId: string, requester?: UserEntity): void {
    if (!requester) return;
    if (requester.id === ownerId) return;
    if (this.isPrivileged(requester)) return;
    throw new ForbiddenException("You are not allowed to access this user's leave records");
  }

  private assertCanMutateLeave(leave: Leave, requester?: UserEntity): void {
    if (!requester) return;
    const ownerId = leave.user?.id;
    if (requester.id === ownerId) return;
    if (this.isPrivileged(requester)) return;
    throw new ForbiddenException('You are not allowed to modify this leave request');
  }

  async create(createLeaveDto: CreateLeaveDto, user: UserEntity): Promise<Leave> {
    // Validate leave type exists and is active
    const leaveType = await this.leaveTypeRepository.findOne({
      where: { name: createLeaveDto.type, isActive: true },
    });

    if (!leaveType) {
      throw new BadRequestException(`Invalid or inactive leave type: ${createLeaveDto.type}`);
    }

    let startDate: moment.Moment;
    let endDate: moment.Moment;
    let requestedDays: number;
    let days: string[] = [];
    const today = moment().startOf('day');

    if (createLeaveDto.isFractional) {
      // Fractional Leave Handling (Single Day Half-Day or Hours)
      const dateStr = createLeaveDto.startDate || createLeaveDto.endDate;
      if (!dateStr) {
        throw new BadRequestException('Date is required for fractional leave');
      }

      startDate = this.createMoment(dateStr);
      endDate = this.createMoment(dateStr);
      requestedDays = createLeaveDto.fractionalDuration
        ? Number(createLeaveDto.fractionalDuration)
        : 0.5;
      days = [startDate.format('YYYY-MM-DD')];

      // Validate no past dates
      if (startDate.isBefore(today, 'day')) {
        throw new BadRequestException('Cannot request leave for past dates');
      }

      // Check emergency leave rule
      if (startDate.isSame(today, 'day') && !leaveType.isEmergency) {
        throw new BadRequestException(
          `Only emergency leave types can be requested for today. "${leaveType.name}" must be requested at least one day in advance.`,
        );
      }
    } else if (createLeaveDto.isCustomDates && createLeaveDto.customDates) {
      // Handle custom dates
      if (!createLeaveDto.customDates.length) {
        throw new BadRequestException('Custom dates cannot be empty');
      }

      const sortedDates = createLeaveDto.customDates
        .map((date) => this.createMoment(date))
        .sort((a, b) => a.diff(b));

      startDate = sortedDates[0];
      endDate = sortedDates[sortedDates.length - 1];
      requestedDays = createLeaveDto.customDates.length;
      days = createLeaveDto.customDates;

      // Validate no past dates
      const pastDate = sortedDates.find((date) => date.isBefore(today, 'day'));
      if (pastDate) {
        throw new BadRequestException('Cannot request leave for past dates');
      }

      // Check emergency leave rule
      const hasToday = sortedDates.some((date) => date.isSame(today, 'day'));
      if (hasToday && !leaveType.isEmergency) {
        throw new BadRequestException(
          `Only emergency leave types can be requested for today. "${leaveType.name}" must be requested at least one day in advance.`,
        );
      }
    } else {
      // Handle date range
      if (!createLeaveDto.startDate || !createLeaveDto.endDate) {
        throw new BadRequestException('Start date and end date are required for range selection');
      }

      startDate = this.createMoment(createLeaveDto.startDate);
      endDate = this.createMoment(createLeaveDto.endDate);
      requestedDays = endDate.diff(startDate, 'days') + 1;
      days = this.generateDateRange(createLeaveDto.startDate, createLeaveDto.endDate);

      // Validate start date is not in the past
      if (startDate.isBefore(today, 'day')) {
        throw new BadRequestException('Cannot request leave for past dates');
      }

      // Check emergency leave rule
      if (startDate.isSame(today, 'day') && !leaveType.isEmergency) {
        throw new BadRequestException(
          `Only emergency leave types can be requested for today. "${leaveType.name}" must be requested at least one day in advance.`,
        );
      }
    }

    // Prevent creating leave that overlaps an existing approved/pending leave for the same user
    const overlappingQuery = this.leaveRepository
      .createQueryBuilder('leave')
      .where('leave.user = :userId', { userId: user.id })
      .andWhere('leave.status IN (:...statuses)', {
        statuses: ['pending', 'clarification_requested', 'approved_by_manager', 'approved'],
      })
      .andWhere('leave.startDate <= :endDate AND leave.endDate >= :startDate', {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      });

    // If both this request and the existing request are fractional on the same date with different halfs, allow
    if (createLeaveDto.isFractional) {
      overlappingQuery.andWhere(
        '(leave.isFractional = false OR leave.fractionalType = :fracType OR leave.fractionalType IS NULL)',
        { fracType: createLeaveDto.fractionalType || 'first_half' },
      );
    }

    const overlappingCount = await overlappingQuery.getCount();

    if (overlappingCount > 0) {
      throw new BadRequestException('Requested dates overlap with already requested/approved leave');
    }

    // Prevent creating leave on company/public holidays
    const holidayCount = await this.holidayRepository
      .createQueryBuilder('holiday')
      .where('holiday.date IN (:...days)', { days })
      .getCount();

    if (holidayCount > 0) {
      throw new BadRequestException('Cannot request leave on company/public holiday');
    }

    // Check leave balance from user_leave_balances table
    const currentYear = startDate.year();
    const balanceCheck = await this.userLeaveBalanceService.checkSufficientBalance(
      user.id,
      leaveType.id,
      currentYear,
      requestedDays,
    );

    if (!balanceCheck.sufficient) {
      throw new BadRequestException(
        balanceCheck.message ||
          `Insufficient leave balance. You have ${balanceCheck.available} days available but requested ${requestedDays} days.`,
      );
    }

    // Load user with role information
    const userWithRole = await this.leaveRepository.manager.getRepository(UserEntity).findOne({
      where: { id: user.id },
      relations: ['role'],
    });

    if (!userWithRole?.role?.name) {
      throw new BadRequestException('User role not found');
    }

    const userRole = userWithRole.role.name.toLowerCase();
    let initialStatus: LeaveStatus = 'pending';

    // Validate manager selection based on user's role
    if (createLeaveDto.requestedManagerId) {
      const requestedManager = await this.getUserDetails(createLeaveDto.requestedManagerId);
      if (!requestedManager) {
        throw new BadRequestException('Selected manager does not exist');
      }

      const managerRole = requestedManager.role?.name?.toLowerCase() || '';

      if (['projectmanager', 'manager', 'admin', 'administrator', 'superuser'].includes(userRole)) {
        if (!['admin', 'administrator', 'superuser'].includes(managerRole)) {
          throw new BadRequestException(
            'Managers must request leave approval from admin or superuser',
          );
        }
        initialStatus = 'approved_by_manager';
      } else {
        if (
          !['projectmanager', 'manager', 'admin', 'administrator', 'superuser'].includes(
            managerRole,
          )
        ) {
          throw new BadRequestException(
            'Regular users must request approval from a manager or higher role',
          );
        }
        initialStatus = 'pending';
      }
    } else {
      throw new BadRequestException('You must select a manager for approval');
    }

    const leave = this.leaveRepository.create({
      ...createLeaveDto,
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      status: initialStatus,
      isFractional: !!createLeaveDto.isFractional,
      fractionalType: createLeaveDto.fractionalType,
      startTime: createLeaveDto.startTime,
      endTime: createLeaveDto.endTime,
      fractionalDuration: createLeaveDto.isFractional
        ? createLeaveDto.fractionalDuration || 0.5
        : null,
      user,
      leaveType,
    });

    const savedLeave = await this.leaveRepository.save(leave);

    // Update pending days in user leave balance and record ledger hold
    await this.userLeaveBalanceService.updatePendingDays(
      user.id,
      leaveType.id,
      currentYear,
      requestedDays,
      savedLeave.id,
    );

    // Send notification to the requested manager
    if (createLeaveDto.requestedManagerId) {
      const requestedManager = await this.getUserDetails(createLeaveDto.requestedManagerId);

      let dateInfo: string;
      if (createLeaveDto.isFractional) {
        dateInfo = `Fractional (${createLeaveDto.fractionalType || 'half-day'}): ${savedLeave.startDate}`;
      } else if (createLeaveDto.isCustomDates && createLeaveDto.customDates) {
        dateInfo = `Custom dates: ${createLeaveDto.customDates.join(', ')}`;
      } else {
        dateInfo = `${createLeaveDto.startDate} to ${createLeaveDto.endDate}`;
      }

      await this.notificationService.create({
        message: `New leave request from ${user.name} for ${createLeaveDto.type} (${dateInfo}) - Requested to: ${requestedManager.name}`,
        users: [createLeaveDto.requestedManagerId],
      });
    }

    return savedLeave;
  }

  async getLeaveBalance(
    userId: string,
    leaveTypeName: string,
    year?: number,
    requester?: UserEntity,
  ): Promise<{
    leaveType: LeaveType;
    allocatedDays: number;
    carriedOverDays: number;
    totalAvailableDays: number;
    usedDays: number;
    pendingDays: number;
    remainingDays: number;
  }> {
    this.validateUUID(userId, 'User ID');
    this.assertCanAccessUser(userId, requester);
    const currentYear = year || moment().year();

    const leaveType = await this.leaveTypeRepository.findOne({
      where: { name: leaveTypeName, isActive: true },
    });

    if (!leaveType) {
      throw new NotFoundException(`Leave type ${leaveTypeName} not found`);
    }

    const balance = await this.userLeaveBalanceService.getUserLeaveBalance(
      userId,
      leaveType.id,
      currentYear,
    );

    if (!balance) {
      return {
        leaveType,
        allocatedDays: 0,
        carriedOverDays: 0,
        totalAvailableDays: 0,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: 0,
      };
    }

    return {
      leaveType,
      allocatedDays: Number(balance.allocatedDays),
      carriedOverDays: Number(balance.carriedOverDays),
      totalAvailableDays: balance.totalAvailableDays,
      usedDays: Number(balance.usedDays),
      pendingDays: Number(balance.pendingDays),
      remainingDays: balance.remainingDays,
    };
  }

  async getAllLeaveBalances(
    userId: string,
    year?: number,
    requester?: UserEntity,
  ): Promise<
    Array<{
      leaveType: LeaveType;
      allocatedDays: number;
      carriedOverDays: number;
      totalAvailableDays: number;
      usedDays: number;
      pendingDays: number;
      remainingDays: number;
    }>
  > {
    this.validateUUID(userId, 'User ID');
    this.assertCanAccessUser(userId, requester);
    const currentYear = year || moment().year();

    const balances = await this.userLeaveBalanceService.getUserAllLeaveBalances(
      userId,
      currentYear,
    );

    return balances.map((balance) => ({
      leaveType: balance.leaveType,
      allocatedDays: Number(balance.allocatedDays),
      carriedOverDays: Number(balance.carriedOverDays),
      totalAvailableDays: balance.totalAvailableDays,
      usedDays: Number(balance.usedDays),
      pendingDays: Number(balance.pendingDays),
      remainingDays: balance.remainingDays,
    }));
  }

  async findAll(status?: string): Promise<Leave[]> {
    const where = status ? { status } : {};
    return this.leaveRepository.find({
      where,
      relations: [
        'user',
        'leaveType',
        'requestedManager',
        'managerApprover',
        'adminApprover',
        'clarificationRequestedBy',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, requester?: UserEntity): Promise<Leave> {
    this.validateUUID(id, 'Leave ID');
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: [
        'user',
        'leaveType',
        'requestedManager',
        'managerApprover',
        'adminApprover',
        'clarificationRequestedBy',
      ],
    });
    if (!leave) throw new NotFoundException('Leave not found');
    if (
      requester &&
      !this.isPrivileged(requester) &&
      requester.id !== leave.user?.id &&
      requester.id !== leave.requestedManagerId
    ) {
      throw new ForbiddenException('You are not allowed to view this leave request');
    }
    return leave;
  }

  async update(id: string, updateLeaveDto: UpdateLeaveDto, requester?: UserEntity): Promise<Leave> {
    this.validateUUID(id, 'Leave ID');
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'leaveType', 'requestedManager'],
    });

    if (!leave) throw new NotFoundException('Leave not found');
    this.assertCanMutateLeave(leave, requester);

    if (!['pending', 'clarification_requested', 'approved_by_manager'].includes(leave.status)) {
      throw new BadRequestException(
        'Only pending, clarification, or manager-approved requests can be edited',
      );
    }

    const patch: UpdateLeaveDto = {
      startDate: updateLeaveDto.startDate,
      endDate: updateLeaveDto.endDate,
      type: updateLeaveDto.type,
      reason: updateLeaveDto.reason,
    };

    const newStart = patch.startDate ?? leave.startDate;
    const newEnd = patch.endDate ?? leave.endDate;
    const oldDays = this.getLeaveDuration(leave);
    const newDays =
      this.createMoment(newEnd).diff(this.createMoment(newStart), 'days') + 1;
    if (newDays < 1) throw new BadRequestException('End date must be on or after start date');
    const balanceYear = this.createMoment(newStart).year();
    if (newDays !== oldDays) {
      await this.userLeaveBalanceService.revertPendingDays(
        leave.user.id,
        leave.leaveType.id,
        balanceYear,
        oldDays,
        leave.id,
        LeaveLedgerAction.LEAVE_CANCELLATION,
        requester?.id,
      );
      await this.userLeaveBalanceService.updatePendingDays(
        leave.user.id,
        leave.leaveType.id,
        balanceYear,
        newDays,
        leave.id,
      );
    }

    const originalStatus = leave.status;

    if (originalStatus === 'approved_by_manager') {
      leave.status = 'pending';
      leave.managerApproverId = null;
      leave.managerApprovalTime = null;

      if (leave.requestedManagerId) {
        await this.notificationService.create({
          message: `${leave.user.name} has updated their leave request. Please review the changes and approve again.`,
          users: [leave.requestedManagerId],
        });
      }

      await this.notificationService.create({
        message: `Your leave request has been updated and reset to pending status. It needs to be approved again by your manager.`,
        users: [leave.user.id],
      });
    }

    Object.keys(patch).forEach((k) => {
      if (patch[k] !== undefined) (leave as any)[k] = patch[k];
    });
    return this.leaveRepository.save(leave);
  }

  async remove(id: string, requester?: UserEntity): Promise<void> {
    this.validateUUID(id, 'Leave ID');
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'leaveType'],
    });

    if (!leave) throw new NotFoundException('Leave not found');
    this.assertCanMutateLeave(leave, requester);

    // If leave has reserved pending days, revert them
    if (['pending', 'clarification_requested', 'approved_by_manager'].includes(leave.status)) {
      const leaveDays = this.getLeaveDuration(leave);
      const year = this.createMoment(leave.startDate).year();

      await this.userLeaveBalanceService.revertPendingDays(
        leave.user.id,
        leave.leaveType.id,
        year,
        leaveDays,
        leave.id,
        LeaveLedgerAction.LEAVE_CANCELLATION,
        requester?.id,
      );
    }

    await this.leaveRepository.delete(id);
  }

  async approveByLead(id: string, userId: string): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    console.warn('approveByLead is deprecated - using approveByPM instead');
    return this.approveByPM(id, userId);
  }

  async approveByPM(id: string, userId: string, notifyAdmins?: string[]): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!leave) throw new NotFoundException('Leave not found');
    if (!['pending', 'clarification_requested'].includes(leave.status)) {
      throw new BadRequestException('Leave not in pending or clarification status');
    }

    leave.status = 'approved_by_manager';
    leave.managerApproverId = userId;
    leave.managerApprovalTime = new Date();

    const savedLeave = await this.leaveRepository.save(leave);
    const manager = await this.getUserDetails(userId);

    await this.notificationService.create({
      message: `Your leave request has been approved by manager ${manager.name} and is now waiting for final approval`,
      users: [leave.user.id],
    });

    if (notifyAdmins && notifyAdmins.length > 0) {
      await this.notificationService.create({
        message: `Leave request from ${leave.user.name} has been approved by manager ${manager.name} and requires your final approval`,
        users: notifyAdmins,
      });
    }

    return savedLeave;
  }

  async approveByAdmin(id: string, userId: string): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'leaveType'],
    });
    if (!leave) throw new NotFoundException('Leave not found');

    if (!leave.managerApproverId) {
      leave.managerApproverId = userId;
      leave.managerApprovalTime = new Date();
    }

    leave.status = 'approved';
    leave.adminApproverId = userId;
    leave.adminApprovalTime = new Date();

    const savedLeave = await this.leaveRepository.save(leave);

    // Update leave balance: convert pending to used days
    const leaveDays = this.getLeaveDuration(leave);
    const year = this.createMoment(leave.startDate).year();

    await this.userLeaveBalanceService.updateUsedDays(
      leave.user.id,
      leave.leaveType.id,
      year,
      leaveDays,
      leave.id,
      userId,
    );

    const admin = await this.getUserDetails(userId);

    await this.notificationService.create({
      message: `Your leave request has been fully approved by ${admin.name} and is now confirmed`,
      users: [leave.user.id],
    });

    return savedLeave;
  }

  async reject(id: string, userId: string): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'leaveType'],
    });
    if (!leave) throw new NotFoundException('Leave not found');

    if (!['pending', 'clarification_requested', 'approved_by_manager'].includes(leave.status)) {
      throw new BadRequestException(`Cannot reject a leave in '${leave.status}' status`);
    }

    leave.status = 'rejected';
    const savedLeave = await this.leaveRepository.save(leave);

    // Revert pending days in user leave balance
    const leaveDays = this.getLeaveDuration(leave);
    const year = this.createMoment(leave.startDate).year();

    await this.userLeaveBalanceService.revertPendingDays(
      leave.user.id,
      leave.leaveType.id,
      year,
      leaveDays,
      leave.id,
      LeaveLedgerAction.LEAVE_REJECTION,
      userId,
    );

    const rejector = await this.getUserDetails(userId);

    await this.notificationService.create({
      message: `Your leave request has been rejected by ${rejector.name}`,
      users: [leave.user.id],
    });

    return savedLeave;
  }

  async approve(id: string, userId: string, notifyAdmins?: string[]): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    const user = await this.getUserDetails(userId);
    const roleName = user.role?.name?.toLowerCase();

    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'leaveType'],
    });
    if (!leave) throw new NotFoundException('Leave not found');

    // Admin and superuser can approve any leave directly
    if (roleName === 'admin' || roleName === 'administrator' || roleName === 'superuser') {
      if (['pending', 'clarification_requested'].includes(leave.status)) {
        leave.managerApproverId = userId;
        leave.managerApprovalTime = new Date();
      }

      leave.status = 'approved';
      leave.adminApproverId = userId;
      leave.adminApprovalTime = new Date();

      const savedLeave = await this.leaveRepository.save(leave);

      const leaveDays = this.getLeaveDuration(leave);
      const leaveYear = this.createMoment(leave.startDate).year();

      await this.userLeaveBalanceService.updateUsedDays(
        leave.user.id,
        leave.leaveType.id,
        leaveYear,
        leaveDays,
        leave.id,
        userId,
      );

      await this.notificationService.create({
        message: `Your leave request has been fully approved by ${user.name} and is now confirmed`,
        users: [leave.user.id],
      });

      return savedLeave;
    }

    // For manager roles, follow the regular approval chain
    if (roleName === 'manager' || roleName === 'projectmanager') {
      if (leave.requestedManagerId !== userId) {
        throw new BadRequestException('You are not the requested manager for this leave');
      }

      if (!['pending', 'clarification_requested'].includes(leave.status)) {
        throw new BadRequestException('Leave is not in a state that can be approved by manager');
      }

      return this.approveByPM(id, userId, notifyAdmins);
    }

    throw new BadRequestException('User does not have permission to approve leaves');
  }

  /**
   * Request clarification from the employee
   */
  async requestClarification(id: string, userId: string, notes: string): Promise<Leave> {
    this.validateUUID(id, 'Leave ID');
    this.validateUUID(userId, 'User ID');

    const user = await this.getUserDetails(userId);
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'leaveType', 'requestedManager'],
    });

    if (!leave) throw new NotFoundException('Leave not found');

    if (!['pending', 'approved_by_manager'].includes(leave.status)) {
      throw new BadRequestException(
        `Cannot request clarification for leave in '${leave.status}' status`,
      );
    }

    const isRequestedManager = leave.requestedManagerId === userId;
    const isPrivileged = this.isPrivileged(user);

    if (!isRequestedManager && !isPrivileged) {
      throw new ForbiddenException('You are not authorized to request clarification on this leave');
    }

    leave.status = 'clarification_requested';
    leave.clarificationNotes = notes;
    leave.clarificationRequestedById = userId;
    leave.clarificationRequestedAt = new Date();

    const savedLeave = await this.leaveRepository.save(leave);

    await this.notificationService.create({
      message: `${user.name} requested clarification for your leave request: "${notes}"`,
      users: [leave.user.id],
    });

    return savedLeave;
  }

  /**
   * Employee responds to a clarification request
   */
  async respondToClarification(id: string, userId: string, response: string): Promise<Leave> {
    this.validateUUID(id, 'Leave ID');
    this.validateUUID(userId, 'User ID');

    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'leaveType', 'requestedManager'],
    });

    if (!leave) throw new NotFoundException('Leave not found');

    if (leave.status !== 'clarification_requested') {
      throw new BadRequestException('Leave is not currently awaiting clarification');
    }

    if (leave.user?.id !== userId) {
      throw new ForbiddenException('Only the leave applicant can respond to clarification');
    }

    leave.clarificationResponse = response;
    leave.clarificationRespondedAt = new Date();
    // Return to previous actionable status: if manager had already approved before admin asked, return to approved_by_manager
    leave.status = leave.managerApproverId ? 'approved_by_manager' : 'pending';

    const savedLeave = await this.leaveRepository.save(leave);

    const notifyUserIds: string[] = [];
    if (leave.clarificationRequestedById) {
      notifyUserIds.push(leave.clarificationRequestedById);
    } else if (leave.requestedManagerId) {
      notifyUserIds.push(leave.requestedManagerId);
    }

    if (notifyUserIds.length > 0) {
      await this.notificationService.create({
        message: `${leave.user.name} responded to leave clarification: "${response}"`,
        users: notifyUserIds,
      });
    }

    return savedLeave;
  }

  // Get leaves that need approval by a specific user
  async getLeavesForApproval(userId: string): Promise<Leave[]> {
    this.validateUUID(userId, 'User ID');
    const user = await this.getUserDetails(userId);
    const roleName = user.role?.name?.toLowerCase();

    let pendingLeaves: Leave[] = [];

    if (roleName === 'superuser') {
      return this.leaveRepository.find({
        relations: [
          'user',
          'user.role',
          'leaveType',
          'requestedManager',
          'managerApprover',
          'adminApprover',
          'clarificationRequestedBy',
        ],
        order: { createdAt: 'DESC' },
      });
    } else if (roleName === 'admin' || roleName === 'administrator') {
      pendingLeaves = await this.leaveRepository.find({
        where: [{ status: 'approved_by_manager' }, { status: 'clarification_requested' }],
        relations: [
          'user',
          'user.role',
          'leaveType',
          'requestedManager',
          'managerApprover',
          'adminApprover',
          'clarificationRequestedBy',
        ],
        order: { createdAt: 'DESC' },
      });

      const directRequests = await this.leaveRepository
        .createQueryBuilder('leave')
        .leftJoinAndSelect('leave.user', 'user')
        .leftJoinAndSelect('user.role', 'userRole')
        .leftJoinAndSelect('leave.leaveType', 'leaveType')
        .leftJoinAndSelect('leave.requestedManager', 'requestedManager')
        .leftJoinAndSelect('leave.managerApprover', 'managerApprover')
        .leftJoinAndSelect('leave.adminApprover', 'adminApprover')
        .leftJoinAndSelect('leave.clarificationRequestedBy', 'clarificationRequestedBy')
        .where('leave.requestedManagerId = :adminId', { adminId: userId })
        .andWhere('leave.status IN (:...statuses)', {
          statuses: ['pending', 'clarification_requested'],
        })
        .andWhere('userRole.name IN (:...managerRoles)', {
          managerRoles: ['manager', 'projectmanager'],
        })
        .orderBy('leave.createdAt', 'DESC')
        .getMany();

      pendingLeaves = [...pendingLeaves, ...directRequests];
    } else if (roleName === 'manager' || roleName === 'projectmanager') {
      const pendingManagerRequests = await this.leaveRepository
        .createQueryBuilder('leave')
        .leftJoinAndSelect('leave.user', 'user')
        .leftJoinAndSelect('user.role', 'userRole')
        .leftJoinAndSelect('leave.leaveType', 'leaveType')
        .leftJoinAndSelect('leave.requestedManager', 'requestedManager')
        .leftJoinAndSelect('leave.managerApprover', 'managerApprover')
        .leftJoinAndSelect('leave.adminApprover', 'adminApprover')
        .leftJoinAndSelect('leave.clarificationRequestedBy', 'clarificationRequestedBy')
        .where('leave.requestedManagerId = :managerId', { managerId: userId })
        .andWhere('leave.status IN (:...statuses)', {
          statuses: ['pending', 'clarification_requested'],
        })
        .andWhere('userRole.name NOT IN (:...managerRoles)', {
          managerRoles: ['manager', 'projectmanager', 'admin', 'administrator', 'superuser'],
        })
        .orderBy('leave.createdAt', 'DESC')
        .getMany();

      const pendingAdminConfirmation = await this.leaveRepository
        .createQueryBuilder('leave')
        .leftJoinAndSelect('leave.user', 'user')
        .leftJoinAndSelect('user.role', 'userRole')
        .leftJoinAndSelect('leave.leaveType', 'leaveType')
        .leftJoinAndSelect('leave.requestedManager', 'requestedManager')
        .leftJoinAndSelect('leave.managerApprover', 'managerApprover')
        .leftJoinAndSelect('leave.adminApprover', 'adminApprover')
        .leftJoinAndSelect('leave.clarificationRequestedBy', 'clarificationRequestedBy')
        .where('leave.managerApproverId = :managerId', { managerId: userId })
        .andWhere('leave.status = :status', { status: 'approved_by_manager' })
        .orderBy('leave.createdAt', 'DESC')
        .getMany();

      pendingLeaves = [...pendingManagerRequests, ...pendingAdminConfirmation];
    } else {
      pendingLeaves = [];
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    return pendingLeaves
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private async getUserDetails(userId: string): Promise<UserEntity> {
    this.validateUUID(userId, 'User ID');
    const user = await this.leaveRepository.manager.getRepository(UserEntity).findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserLeaves(userId: string, status?: string, requester?: UserEntity): Promise<Leave[]> {
    this.validateUUID(userId, 'User ID');
    this.assertCanAccessUser(userId, requester);
    const where: any = { user: { id: userId } };
    if (status && status !== 'all') where.status = status;

    return this.leaveRepository.find({
      where,
      relations: [
        'leaveType',
        'user',
        'user.role',
        'requestedManager',
        'managerApprover',
        'adminApprover',
        'clarificationRequestedBy',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async calendarView(from: string, to: string, projectId?: string): Promise<Leave[]> {
    let query = this.leaveRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.user', 'user')
      .leftJoinAndSelect('leave.leaveType', 'leaveType')
      .leftJoinAndSelect('leave.requestedManager', 'requestedManager')
      .leftJoinAndSelect('leave.managerApprover', 'managerApprover')
      .leftJoinAndSelect('leave.adminApprover', 'adminApprover')
      .where('leave.startDate <= :to AND leave.endDate >= :from', { from, to })
      .andWhere('leave.status = :status', { status: 'approved' });

    if (projectId) {
      this.validateUUID(projectId, 'Project ID');
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: ['users'],
      });

      if (project) {
        const userIds = project.users.map((user) => user.id);
        if (userIds.length > 0) {
          query = query.andWhere('user.id IN (:...userIds)', { userIds });
        }
      }
    }

    return query.getMany();
  }
}
