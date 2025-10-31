import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
import * as moment from 'moment';

@Injectable()
export class LeaveService {
  /**
   * UPDATED: 2025-10-06
   * - Fixed getLeavesForApproval to correctly return leaves requiring approval
   * - Added more detailed logging to help diagnose permission issues
   * - Added support for alternative role name formats (projectmanager/manager, teamlead/projectlead)
   * - Removed override functionality as requested
   */
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
    
    // Handle null, undefined, or empty strings
    if (!id || id.trim() === '' || id === 'undefined' || id === 'null') {
      throw new BadRequestException(`${fieldName} is required`);
    }
    
    // Convert to string and trim whitespace
    const cleanId = id.toString().trim();
    
    // Check for common invalid formats
    if (cleanId.includes('"') || cleanId.includes("'") || cleanId.includes(' ')) {
      throw new BadRequestException(`Invalid ${fieldName} format - contains invalid characters`);
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Allow simple numeric IDs as well for backward compatibility
    const isNumeric = /^\d+$/.test(cleanId);
    
    if (!uuidRegex.test(cleanId) && !isNumeric) {
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
    
  }

  async create(createLeaveDto: CreateLeaveDto, user: UserEntity): Promise<Leave> {
    // Validate leave type exists and is active
    const leaveType = await this.leaveTypeRepository.findOne({
      where: { name: createLeaveDto.type, isActive: true }
    });

    if (!leaveType) {
      throw new BadRequestException(`Invalid or inactive leave type: ${createLeaveDto.type}`);
    }

    let startDate: moment.Moment;
    let endDate: moment.Moment;
    let requestedDays: number;
    let days: string[] = [];
    const today = moment().startOf('day');

    if (createLeaveDto.isCustomDates && createLeaveDto.customDates) {
      // Handle custom dates
      if (!createLeaveDto.customDates.length) {
        throw new BadRequestException('Custom dates cannot be empty');
      }

      // Validate and sort custom dates
      const sortedDates = createLeaveDto.customDates
        .map(date => this.createMoment(date))
        .sort((a, b) => a.diff(b));

      startDate = sortedDates[0];
      endDate = sortedDates[sortedDates.length - 1];
      requestedDays = createLeaveDto.customDates.length;
      days = createLeaveDto.customDates;

      // Validate no past dates
      const pastDate = sortedDates.find(date => date.isBefore(today, 'day'));
      if (pastDate) {
        throw new BadRequestException('Cannot request leave for past dates');
      }

      // Check if any date is today and if it's not an emergency leave
      const hasToday = sortedDates.some(date => date.isSame(today, 'day'));
      if (hasToday && !leaveType.isEmergency) {
        throw new BadRequestException(
          `Only emergency leave types can be requested for today. "${leaveType.name}" must be requested at least one day in advance.`
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

      // Check if start date is today and if it's not an emergency leave
      if (startDate.isSame(today, 'day') && !leaveType.isEmergency) {
        throw new BadRequestException(
          `Only emergency leave types can be requested for today. "${leaveType.name}" must be requested at least one day in advance.`
        );
      }
    }

    // Prevent creating leave that overlaps an existing approved leave for the same user
    const overlappingApproved = await this.leaveRepository
      .createQueryBuilder('leave')
      .where('leave.user = :userId', { userId: user.id })
      .andWhere('leave.status IN (:...statuses)', { statuses: ['approved', 'approved_by_pm'] })
      .andWhere('leave.startDate <= :endDate AND leave.endDate >= :startDate', { 
        startDate: startDate.format('YYYY-MM-DD'), 
        endDate: endDate.format('YYYY-MM-DD') 
      })
      .getCount();

    if (overlappingApproved > 0) {
      throw new BadRequestException('Requested dates overlap with already approved leave');
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
      requestedDays
    );

    if (!balanceCheck.sufficient) {
      throw new BadRequestException(
        balanceCheck.message || 
        `Insufficient leave balance. You have ${balanceCheck.available} days available but requested ${requestedDays} days.`
      );
    }

    // Load user with role information
    const userWithRole = await this.leaveRepository.manager
      .getRepository(UserEntity)
      .findOne({
        where: { id: user.id },
        relations: ['role']
      });

    if (!userWithRole?.role?.name) {
      throw new BadRequestException('User role not found');
    }

    const userRole = userWithRole.role.name.toLowerCase();
    let initialStatus: LeaveStatus = 'pending';
    
    // Validate manager selection based on user's role
    if (createLeaveDto.requestedManagerId) {
      // Verify the requested manager exists and has appropriate role
      const requestedManager = await this.getUserDetails(createLeaveDto.requestedManagerId);
      if (!requestedManager) {
        throw new BadRequestException('Selected manager does not exist');
      }
      
      const managerRole = requestedManager.role?.name?.toLowerCase() || '';
      
      // Check if user is selecting an appropriate manager based on their role
      if (['projectmanager', 'manager', 'admin', 'administrator', 'superuser'].includes(userRole)) {
        // Managers and above must select admin/superuser as approvers
        if (!['admin', 'administrator', 'superuser'].includes(managerRole)) {
          throw new BadRequestException('Managers must request leave approval from admin or superuser');
        }
        // Skip to manager approval level since they're already a manager
        initialStatus = 'approved_by_manager';
      } else {
        // Regular users must select at least a manager as approver
        if (!['projectmanager', 'manager', 'admin', 'administrator', 'superuser'].includes(managerRole)) {
          throw new BadRequestException('Regular users must request approval from a manager or higher role');
        }
        // Regular user stays at pending status
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
      user,
      leaveType 
    });
    
    const savedLeave = await this.leaveRepository.save(leave);
    
    // Update pending days in user leave balance
    await this.userLeaveBalanceService.updatePendingDays(
      user.id,
      leaveType.id,
      currentYear,
      requestedDays
    );
    
    // Send notification to the requested manager
    if (createLeaveDto.requestedManagerId) {
      const requestedManager = await this.getUserDetails(createLeaveDto.requestedManagerId);
      
      let dateInfo: string;
      if (createLeaveDto.isCustomDates && createLeaveDto.customDates) {
        dateInfo = `Custom dates: ${createLeaveDto.customDates.join(', ')}`;
      } else {
        dateInfo = `${createLeaveDto.startDate} to ${createLeaveDto.endDate}`;
      }
      
      await this.notificationService.create({
        message: `New leave request from ${user.name} for ${createLeaveDto.type} (${dateInfo}) - Requested to: ${requestedManager.name}`,
        users: [createLeaveDto.requestedManagerId]
      });
    }
    
    return savedLeave;
  }

  private async getUsedLeavedays(user: UserEntity, type: string, year: number): Promise<number> {
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;
    
    const approvedLeaves = await this.leaveRepository
      .createQueryBuilder('leave')
      .where('leave.user = :userId', { userId: user.id })
      .andWhere('leave.type = :type', { type })
      .andWhere('leave.status IN (:...statuses)', { statuses: ['approved', 'approved_by_manager'] })
      .andWhere('leave.startDate <= :endOfYear', { endOfYear })
      .andWhere('leave.endDate >= :startOfYear', { startOfYear })
      .getMany();

    return approvedLeaves.reduce((total, leave) => {
      const leaveStart = this.createMoment(leave.startDate);
      const leaveEnd = this.createMoment(leave.endDate);
      const yearStart = this.createMoment(startOfYear);
      const yearEnd = this.createMoment(endOfYear);
      
      // Calculate overlap with the year
      const overlapStart = moment.max(leaveStart, yearStart);
      const overlapEnd = moment.min(leaveEnd, yearEnd);
      
      return total + overlapEnd.diff(overlapStart, 'days') + 1;
    }, 0);
  }

  async getLeaveBalance(userId: string, leaveTypeName: string, year?: number): Promise<{
    leaveType: LeaveType;
    allocatedDays: number;
    carriedOverDays: number;
    totalAvailableDays: number;
    usedDays: number;
    pendingDays: number;
    remainingDays: number;
  }> {
    this.validateUUID(userId, 'User ID');
    const leaveType = await this.leaveTypeRepository.findOne({
      where: { name: leaveTypeName, isActive: true }
    });

    if (!leaveType) {
      throw new NotFoundException(`Leave type '${leaveTypeName}' not found or inactive`);
    }

    const currentYear = year || moment().year();
    const balance = await this.userLeaveBalanceService.getUserLeaveBalance(
      userId,
      leaveType.id,
      currentYear
    );

    if (!balance) {
      // No balance allocated yet
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

  async getAllLeaveBalances(userId: string, year?: number): Promise<Array<{
    leaveType: LeaveType;
    allocatedDays: number;
    carriedOverDays: number;
    totalAvailableDays: number;
    usedDays: number;
    pendingDays: number;
    remainingDays: number;
  }>> {
    this.validateUUID(userId, 'User ID');
    const currentYear = year || moment().year();
    
    const balances = await this.userLeaveBalanceService.getUserAllLeaveBalances(userId, currentYear);
    
    return balances.map(balance => ({
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
      relations: ['user', 'leaveType', 'requestedManager', 'managerApprover', 'adminApprover'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Leave> {
    this.validateUUID(id, 'Leave ID');
    const leave = await this.leaveRepository.findOne({ 
      where: { id },
      relations: ['user', 'leaveType', 'requestedManager', 'managerApprover', 'adminApprover']
    });
    if (!leave) throw new NotFoundException('Leave not found');
    return leave;
  }

  async update(id: string, updateLeaveDto: UpdateLeaveDto): Promise<Leave> {
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'requestedManager']
    });
    
    if (!leave) throw new NotFoundException('Leave not found');
    
    // Store the original status before update
    const originalStatus = leave.status;
    
    // If the leave was approved_by_manager and is being edited, reset it to pending
    // This requires the manager to re-approve
    if (originalStatus === 'approved_by_manager') {
      leave.status = 'pending';
      leave.managerApproverId = null;
      leave.managerApprovalTime = null;
      
      // Send notification to the manager that the leave was updated
      if (leave.requestedManagerId) {
        const manager = await this.getUserDetails(leave.requestedManagerId);
        await this.notificationService.create({
          message: `${leave.user.name} has updated their leave request. Please review the changes and approve again.`,
          users: [leave.requestedManagerId]
        });
      }
      
      // Send notification to user that their leave is back to pending
      await this.notificationService.create({
        message: `Your leave request has been updated and reset to pending status. It needs to be approved again by your manager.`,
        users: [leave.user.id]
      });
    }
    
    Object.assign(leave, updateLeaveDto);
    return this.leaveRepository.save(leave);
  }

  async remove(id: string): Promise<void> {
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'leaveType']
    });
    
    if (!leave) throw new NotFoundException('Leave not found');
    
    // If leave is pending, revert the pending days
    if (leave.status === 'pending' || leave.status === 'approved_by_manager') {
      const startDate = this.createMoment(leave.startDate);
      const endDate = this.createMoment(leave.endDate);
      const leaveDays = endDate.diff(startDate, 'days') + 1;
      const year = startDate.year();
      
      await this.userLeaveBalanceService.revertPendingDays(
        leave.user.id,
        leave.leaveType.id,
        year,
        leaveDays
      );
    }
    
    await this.leaveRepository.delete(id);
  }

  // Approval logic
  /**
   * @deprecated This method is deprecated as the team lead step has been removed from the workflow
   * Kept for backwards compatibility with existing API endpoints
   */
  async approveByLead(id: string, userId: string): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    // For compatibility, we'll treat this as a manager approval
    console.warn('approveByLead is deprecated - using approveByPM instead');
    return this.approveByPM(id, userId);
  }

  async approveByPM(id: string, userId: string, notifyAdmins?: string[]): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user']
    });
    if (!leave) throw new NotFoundException('Leave not found');
    if (leave.status !== 'pending') throw new BadRequestException('Leave not in pending status');
    
    // Manager approval - moves to waiting for admin/superuser approval
    leave.status = 'approved_by_manager';
    leave.managerApproverId = userId;
    leave.managerApprovalTime = new Date();
    
    const savedLeave = await this.leaveRepository.save(leave);
    
    // Get manager details for notification
    const manager = await this.getUserDetails(userId);
    
    // Send notification to user about manager approval
    await this.notificationService.create({
      message: `Your leave request has been approved by manager ${manager.name} and is now waiting for final approval`,
      users: [leave.user.id]
    });
    
    // Send notification to selected admins if provided
    if (notifyAdmins && notifyAdmins.length > 0) {
      await this.notificationService.create({
        message: `Leave request from ${leave.user.name} has been approved by manager ${manager.name} and requires your final approval`,
        users: notifyAdmins
      });
    }
    
    return savedLeave;
  }

  async approveByAdmin(id: string, userId: string): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'leaveType']
    });
    if (!leave) throw new NotFoundException('Leave not found');
    
    // Admin/superuser can approve any leave that is pending or approved_by_manager
    // For the two-level approval, admin usually approves leaves that were already approved by managers
    // But admins/superusers can also directly approve pending leaves from managers
    
    // Fill in manager approver ID if missing (if a manager requested leave directly to admin)
    if (!leave.managerApproverId) {
      leave.managerApproverId = userId;
      leave.managerApprovalTime = new Date();
    }
    
    leave.status = 'approved';
    leave.adminApproverId = userId;
    leave.adminApprovalTime = new Date();
    
    const savedLeave = await this.leaveRepository.save(leave);
    
    // Update leave balance: convert pending to used days
    const startDate = this.createMoment(leave.startDate);
    const endDate = this.createMoment(leave.endDate);
    const leaveDays = endDate.diff(startDate, 'days') + 1;
    const year = startDate.year();
    
    await this.userLeaveBalanceService.updateUsedDays(
      leave.user.id,
      leave.leaveType.id,
      year,
      leaveDays
    );
    
    // Get admin details for notification
    const admin = await this.getUserDetails(userId);
    
    // Send notification to user about final approval
    await this.notificationService.create({
      message: `Your leave request has been fully approved by ${admin.name} and is now confirmed`,
      users: [leave.user.id]
    });
    
    return savedLeave;
  }

  async reject(id: string, userId: string): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'leaveType']
    });
    if (!leave) throw new NotFoundException('Leave not found');
    
    leave.status = 'rejected';
    
    const savedLeave = await this.leaveRepository.save(leave);
    
    // Revert pending days in user leave balance
    const startDate = this.createMoment(leave.startDate);
    const endDate = this.createMoment(leave.endDate);
    const leaveDays = endDate.diff(startDate, 'days') + 1;
    const year = startDate.year();
    
    await this.userLeaveBalanceService.revertPendingDays(
      leave.user.id,
      leave.leaveType.id,
      year,
      leaveDays
    );
    
    // Get rejector details for notification
    const rejector = await this.getUserDetails(userId);
    
    // Send notification to user about rejection
    await this.notificationService.create({
      message: `Your leave request has been rejected by ${rejector.name}`,
      users: [leave.user.id]
    });
    
    return savedLeave;
  }

  // Admin can manage leave approval through the regular approve/reject methods
  // Override functionality removed as requested

  // Generic approve method that determines the correct approval level based on user role
  async approve(id: string, userId: string, notifyAdmins?: string[]): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    
    // Get user details and their role
    const user = await this.getUserDetails(userId);
    const roleName = user.role?.name?.toLowerCase();
    
    // Get the leave details
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user']
    });
    if (!leave) throw new NotFoundException('Leave not found');
    
    const leaveRequesterRole = leave.user?.role?.name?.toLowerCase();
    
    // Admin and superuser can approve any leave - now with direct full approval
    if (roleName === 'admin' || roleName === 'administrator' || roleName === 'superuser') {
      // If the leave is in pending status, set both manager and admin approval at once
      if (leave.status === 'pending') {
        // Set manager approval first (using the admin as the manager approver)
        leave.managerApproverId = userId;
        leave.managerApprovalTime = new Date();
      }
      
      // Then set admin approval (full approval)
      leave.status = 'approved';
      leave.adminApproverId = userId;
      leave.adminApprovalTime = new Date();
      
      const savedLeave = await this.leaveRepository.save(leave);
      
      // Update leave balance: convert pending to used days
      const leaveStartDate = this.createMoment(leave.startDate);
      const leaveEndDate = this.createMoment(leave.endDate);
      const leaveDays = leaveEndDate.diff(leaveStartDate, 'days') + 1;
      const leaveYear = leaveStartDate.year();
      
      await this.userLeaveBalanceService.updateUsedDays(
        leave.user.id,
        leave.leaveType.id,
        leaveYear,
        leaveDays
      );
      
      // Send notification to user about full approval
      await this.notificationService.create({
        message: `Your leave request has been fully approved by ${user.name} and is now confirmed`,
        users: [leave.user.id]
      });
      
      return savedLeave;
    }
    
    // For manager roles, follow the regular approval chain
    if (roleName === 'manager' || roleName === 'projectmanager') {
      // Verify this manager was requested to approve this leave
      if (leave.requestedManagerId !== userId) {
        throw new BadRequestException('You are not the requested manager for this leave');
      }

      // Manager can only approve pending leaves
      if (leave.status !== 'pending') {
        throw new BadRequestException('Leave is not in a state that can be approved by manager');
      }
      
      return this.approveByPM(id, userId, notifyAdmins);
    } 
    
    // All other roles cannot approve leave requests
    throw new BadRequestException('User does not have permission to approve leaves');
  }

  // Get leaves that need approval by a specific user (based on their role and projects)
  async getLeavesForApproval(userId: string): Promise<Leave[]> {
    this.validateUUID(userId, 'User ID');
    // Get user details and their role
    const user = await this.getUserDetails(userId);
    const roleName = user.role?.name?.toLowerCase();
    
    let pendingLeaves: Leave[] = [];


    if (roleName === 'superuser') {
      // Superuser can see ALL leave requests in the system regardless of status
      const superuserLeaves = await this.leaveRepository.find({
        relations: ['user', 'user.role', 'leaveType', 'requestedManager', 'managerApprover', 'adminApprover'],
        order: { createdAt: 'DESC' }
      });
      
      return superuserLeaves;
        
    } else if (roleName === 'admin' || roleName === 'administrator') {
      // Admin can see all pending leave requests from managers (approved_by_manager status)
      // These are leaves that have already been approved by managers and need final admin approval
      pendingLeaves = await this.leaveRepository.find({
        where: { status: 'approved_by_manager' },
        relations: ['user', 'user.role', 'leaveType', 'requestedManager', 'managerApprover', 'adminApprover'],
        order: { createdAt: 'DESC' }
      });
            
      // Admin can also see pending leaves that were directly requested to them by managers
      const directRequests = await this.leaveRepository
        .createQueryBuilder('leave')
        .leftJoinAndSelect('leave.user', 'user')
        .leftJoinAndSelect('user.role', 'userRole')
        .leftJoinAndSelect('leave.leaveType', 'leaveType')
        .leftJoinAndSelect('leave.requestedManager', 'requestedManager')
        .leftJoinAndSelect('leave.managerApprover', 'managerApprover')
        .leftJoinAndSelect('leave.adminApprover', 'adminApprover')
        .where('leave.requestedManagerId = :adminId', { adminId: userId })
        .andWhere('leave.status = :status', { status: 'pending' })
        .andWhere('userRole.name IN (:...managerRoles)', { 
          managerRoles: ['manager', 'projectmanager'] 
        })
        .orderBy('leave.createdAt', 'DESC')
        .getMany();
        
      pendingLeaves = [...pendingLeaves, ...directRequests];
        
    } else if (roleName === 'manager' || roleName === 'projectmanager') {

      // Manager sees leaves where they are specifically requested as approver
      // These are pending leave requests from regular users
      pendingLeaves = await this.leaveRepository
        .createQueryBuilder('leave')
        .leftJoinAndSelect('leave.user', 'user')
        .leftJoinAndSelect('user.role', 'userRole')
        .leftJoinAndSelect('leave.leaveType', 'leaveType')
        .leftJoinAndSelect('leave.requestedManager', 'requestedManager')
        .leftJoinAndSelect('leave.managerApprover', 'managerApprover')
        .leftJoinAndSelect('leave.adminApprover', 'adminApprover')
        .where('leave.requestedManagerId = :managerId', { managerId: userId })
        .andWhere('leave.status = :status', { status: 'pending' })
        // Only show requests from non-manager users
        .andWhere('userRole.name NOT IN (:...managerRoles)', { 
          managerRoles: ['manager', 'projectmanager', 'admin', 'administrator', 'superuser'] 
        })
        .orderBy('leave.createdAt', 'DESC')
        .getMany();      
      // Manager can see leaves they've approved that are waiting for admin confirmation
      const pendingAdminConfirmation = await this.leaveRepository
        .createQueryBuilder('leave')
        .leftJoinAndSelect('leave.user', 'user')
        .leftJoinAndSelect('user.role', 'userRole')
        .leftJoinAndSelect('leave.leaveType', 'leaveType')
        .leftJoinAndSelect('leave.requestedManager', 'requestedManager')
        .leftJoinAndSelect('leave.managerApprover', 'managerApprover')
        .leftJoinAndSelect('leave.adminApprover', 'adminApprover')
        .where('leave.managerApproverId = :managerId', { managerId: userId })
        .andWhere('leave.status = :status', { status: 'approved_by_manager' })
        .orderBy('leave.createdAt', 'DESC')
        .getMany();
        
      pendingLeaves = [...pendingLeaves, ...pendingAdminConfirmation];
    } else {
      // Regular users don't have any approval responsibilities
      pendingLeaves = [];
    }

    return pendingLeaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private async getUserDetails(userId: string): Promise<UserEntity> {
    this.validateUUID(userId, 'User ID');
    // This should be injected from the UserService in a real implementation
    // For now, we'll do a simple query - you should inject UserRepository or UserService
    const user = await this.leaveRepository.manager
      .getRepository(UserEntity)
      .findOne({
        where: { id: userId },
        relations: ['role']
      });
    
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Get user's own leaves
  async getUserLeaves(userId: string, status?: string): Promise<Leave[]> {
    this.validateUUID(userId, 'User ID');
    const where: any = { user: { id: userId } };
    if (status && status !== 'all') where.status = status;

    return this.leaveRepository.find({
      where,
      relations: ['leaveType', 'user', 'user.role', 'requestedManager', 'managerApprover', 'adminApprover'],
      order: { createdAt: 'DESC' }
    });
  }

  // Calendar view: get all leaves in a date range, optionally filter by project
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
      // Validate UUID format
      this.validateUUID(projectId, 'Project ID');

      // Filter by project team members
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: ['users']
      });

      if (project) {
        const userIds = project.users.map(user => user.id);
        if (userIds.length > 0) {
          query = query.andWhere('user.id IN (:...userIds)', { userIds });
        }
      }
    }

    return query.getMany();
  }
}
