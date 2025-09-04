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
  ) {}

  private createMoment(dateInput: any): moment.Moment {
    if (!dateInput) {
      console.error('createMoment: No date input provided');
      throw new BadRequestException('Date is required');
    }
    
    console.log('createMoment input:', dateInput, 'type:', typeof dateInput);
    
    try {
      const m = moment(dateInput);
      console.log('createMoment result:', m.format(), 'isValid:', m.isValid());
      
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
    console.log('generateDateRange called with:', { startDate, endDate });
    
    try {
      const start = this.createMoment(startDate);
      const end = this.createMoment(endDate);
      const days: string[] = [];
      
      const current = start.clone();
      console.log('Starting date range generation, current:', current.format(), 'end:', end.format());
      
      while (current.isSameOrBefore(end)) {
        days.push(current.format('YYYY-MM-DD'));
        current.add(1, 'day');
        
        // Safety check to prevent infinite loops
        if (days.length > 365) {
          console.error('generateDateRange: Too many days generated, breaking loop');
          throw new BadRequestException('Date range too large');
        }
      }
      
      console.log('Generated date range:', days);
      return days;
    } catch (error) {
      console.error('generateDateRange error:', error);
      throw error;
    }
  }

  private validateUUID(id: string, fieldName: string = 'ID'): void {
    console.log(`Validating ${fieldName}:`, id, typeof id, `length:`, id?.length);
    
    // Handle null, undefined, or empty strings
    if (!id || id.trim() === '' || id === 'undefined' || id === 'null') {
      console.log(`Validation failed for ${fieldName}: empty, null, or undefined value`);
      throw new BadRequestException(`${fieldName} is required`);
    }
    
    // Convert to string and trim whitespace
    const cleanId = id.toString().trim();
    console.log(`Cleaned ID:`, cleanId, `length:`, cleanId.length);
    
    // Check for common invalid formats
    if (cleanId.includes('"') || cleanId.includes("'") || cleanId.includes(' ')) {
      console.log(`Validation failed for ${fieldName}: contains invalid characters`);
      throw new BadRequestException(`Invalid ${fieldName} format - contains invalid characters`);
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Allow simple numeric IDs as well for backward compatibility
    const isNumeric = /^\d+$/.test(cleanId);
    
    console.log(`UUID regex test:`, uuidRegex.test(cleanId));
    console.log(`Numeric test:`, isNumeric);
    
    if (!uuidRegex.test(cleanId) && !isNumeric) {
      console.log(`Validation failed for ${fieldName}: ${cleanId} - does not match UUID or numeric format`);
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
    
    console.log(`Validation passed for ${fieldName}: ${cleanId}`);
  }

  async create(createLeaveDto: CreateLeaveDto, user: UserEntity): Promise<Leave> {
    // Validate leave type exists and is active
    const leaveType = await this.leaveTypeRepository.findOne({
      where: { name: createLeaveDto.type, isActive: true }
    });

    if (!leaveType) {
      throw new BadRequestException(`Invalid or inactive leave type: ${createLeaveDto.type}`);
    }

    // Calculate requested days
    const startDate = this.createMoment(createLeaveDto.startDate);
    const endDate = this.createMoment(createLeaveDto.endDate);
    const requestedDays = endDate.diff(startDate, 'days') + 1;

    // Prevent creating leave that overlaps an existing approved leave for the same user
    const overlappingApproved = await this.leaveRepository
      .createQueryBuilder('leave')
      .where('leave.user = :userId', { userId: user.id })
      .andWhere('leave.status IN (:...statuses)', { statuses: ['approved', 'approved_by_lead', 'approved_by_pm'] })
      .andWhere('leave.startDate <= :endDate AND leave.endDate >= :startDate', { startDate: createLeaveDto.startDate, endDate: createLeaveDto.endDate })
      .getCount();

    if (overlappingApproved > 0) {
      throw new BadRequestException('Requested dates overlap with already approved leave');
    }

    // Prevent creating leave on company/public holidays
    const days = this.generateDateRange(createLeaveDto.startDate, createLeaveDto.endDate);

    const holidayCount = await this.holidayRepository
      .createQueryBuilder('holiday')
      .where('holiday.date IN (:...days)', { days })
      .getCount();

    if (holidayCount > 0) {
      throw new BadRequestException('Cannot request leave on company/public holiday');
    }

    // Check if leave type has a limit and validate against used days
    if (leaveType.maxDaysPerYear) {
      const currentYear = startDate.year();
      const usedDays = await this.getUsedLeavedays(user, createLeaveDto.type, currentYear);
      
      if (usedDays + requestedDays > leaveType.maxDaysPerYear) {
        throw new BadRequestException(
          `Cannot request ${requestedDays} days. You have used ${usedDays} out of ${leaveType.maxDaysPerYear} days for ${leaveType.name} this year.`
        );
      }
    }

    // Determine initial status based on user role hierarchy
    let initialStatus: LeaveStatus = 'pending';
    
    // Load user with role information
    const userWithRole = await this.leaveRepository.manager
      .getRepository(UserEntity)
      .findOne({
        where: { id: user.id },
        relations: ['role']
      });

    if (userWithRole?.role?.name) {
      const roleName = userWithRole.role.name.toLowerCase();
      
      // Project Manager goes directly to admin approval
      if (roleName === 'projectmanager') {
        initialStatus = 'approved_by_pm';
      }
      // Team Lead skips to PM approval
      else if (roleName === 'teamlead') {
        initialStatus = 'approved_by_lead';
      }
      // Admin and Superuser requests skip to PM approval (need admin/superuser approval)
      else if (roleName === 'admin' || roleName === 'superuser') {
        initialStatus = 'approved_by_pm';
      }
      // Regular employees start with pending (goes to team lead first)
      else {
        initialStatus = 'pending';
      }
    }

    const leave = this.leaveRepository.create({ 
      ...createLeaveDto, 
      status: initialStatus,
      user,
      leaveType 
    });
    
    return this.leaveRepository.save(leave);
  }

  private async getUsedLeavedays(user: UserEntity, type: string, year: number): Promise<number> {
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;
    
    const approvedLeaves = await this.leaveRepository
      .createQueryBuilder('leave')
      .where('leave.user = :userId', { userId: user.id })
      .andWhere('leave.type = :type', { type })
      .andWhere('leave.status IN (:...statuses)', { statuses: ['approved', 'approved_by_lead', 'approved_by_pm'] })
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
    maxDays: number | null;
    usedDays: number;
    remainingDays: number | null;
  }> {
    this.validateUUID(userId, 'User ID');
    const leaveType = await this.leaveTypeRepository.findOne({
      where: { name: leaveTypeName, isActive: true }
    });

    if (!leaveType) {
      throw new NotFoundException(`Leave type '${leaveTypeName}' not found or inactive`);
    }

    const currentYear = year || moment().year();
    const user = { id: userId } as UserEntity;
    const usedDays = await this.getUsedLeavedays(user, leaveTypeName, currentYear);
    
    return {
      leaveType,
      maxDays: leaveType.maxDaysPerYear,
      usedDays,
      remainingDays: leaveType.maxDaysPerYear ? leaveType.maxDaysPerYear - usedDays : null,
    };
  }

  async getAllLeaveBalances(userId: string, year?: number): Promise<Array<{
    leaveType: LeaveType;
    maxDays: number | null;
    usedDays: number;
    remainingDays: number | null;
  }>> {
    this.validateUUID(userId, 'User ID');
    const activeLeaveTypes = await this.leaveTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });

    const balances = [];
    for (const leaveType of activeLeaveTypes) {
      const balance = await this.getLeaveBalance(userId, leaveType.name, year);
      balances.push(balance);
    }

    return balances;
  }

  async findAll(status?: string): Promise<Leave[]> {
    const where = status ? { status } : {};
    return this.leaveRepository.find({ where });
  }

  async findOne(id: string): Promise<Leave> {
    this.validateUUID(id, 'Leave ID');
    const leave = await this.leaveRepository.findOne({ where: { id } });
    if (!leave) throw new NotFoundException('Leave not found');
    return leave;
  }

  async update(id: string, updateLeaveDto: UpdateLeaveDto): Promise<Leave> {
    const leave = await this.findOne(id);
    Object.assign(leave, updateLeaveDto);
    return this.leaveRepository.save(leave);
  }

  async remove(id: string): Promise<void> {
    const result = await this.leaveRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Leave not found');
  }

  // Approval logic
  async approveByLead(id: string, userId: string): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    const leave = await this.findOne(id);
    if (leave.status !== 'pending') throw new BadRequestException('Leave not pending');
    leave.status = 'approved_by_lead';
    leave.leadApproverId = userId;
    return this.leaveRepository.save(leave);
  }

  async approveByPM(id: string, userId: string): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    const leave = await this.findOne(id);
    if (leave.status !== 'approved_by_lead') throw new BadRequestException('Leave not approved by lead');
    leave.status = 'approved_by_pm';
    leave.pmApproverId = userId;
    return this.leaveRepository.save(leave);
  }

  async approveByAdmin(id: string, userId: string): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    const leave = await this.findOne(id);
    if (leave.status !== 'approved_by_pm') throw new BadRequestException('Leave not approved by PM');
    leave.status = 'approved';
    leave.adminApproverId = userId;
    return this.leaveRepository.save(leave);
  }

  async reject(id: string, userId: string): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    const leave = await this.findOne(id);
    leave.status = 'rejected';
    // Optionally track who rejected
    return this.leaveRepository.save(leave);
  }

  // Override an already approved leave (revert to pending or appropriate status)
  async override(id: string, userId: string, newStatus: 'pending' | 'rejected' = 'pending'): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    
    const user = await this.getUserDetails(userId);
    const leave = await this.findOne(id);
    
    // Only allow override of approved leaves
    if (leave.status !== 'approved') {
      throw new BadRequestException('Can only override approved leaves');
    }
    
    // Check if user has authority to override based on role hierarchy
    const currentUserRole = user.role?.name?.toLowerCase();
    const requesterRole = leave.user?.role?.name?.toLowerCase();
    
    const canOverride = 
      (currentUserRole === 'superuser') ||
      (currentUserRole === 'administrator' && ['manager', 'projectlead', 'auditjunior'].includes(requesterRole || '')) ||
      (currentUserRole === 'manager' && ['projectlead', 'auditjunior'].includes(requesterRole || '')) ||
      (currentUserRole === 'projectlead' && requesterRole === 'auditjunior');
    
    if (!canOverride) {
      throw new BadRequestException('You do not have authority to override this approval');
    }
    
    // Reset the leave to appropriate status based on override reason
    leave.status = newStatus;
    leave.adminApproverId = null; // Clear approval trail
    leave.pmApproverId = null;
    if (newStatus === 'pending') {
      leave.leadApproverId = null;
    }
    
    // Track who performed the override
    leave.overriddenBy = userId;
    leave.overriddenAt = new Date();
    
    return this.leaveRepository.save(leave);
  }

  // Generic approve method that determines the correct approval level based on user role
  async approve(id: string, userId: string): Promise<Leave> {
    this.validateUUID(userId, 'User ID');
    
    // Get user details and their role
    const user = await this.getUserDetails(userId);
    const roleName = user.role?.name?.toLowerCase();
    
    // Determine which approval method to use based on role
    if (roleName === 'teamlead') {
      return this.approveByLead(id, userId);
    } else if (roleName === 'projectmanager') {
      return this.approveByPM(id, userId);
    } else if (roleName === 'admin') {
      return this.approveByAdmin(id, userId);
    } else if (roleName === 'superuser') {
      // Superuser can directly approve to final status
      return this.approveByAdmin(id, userId);
    } else {
      throw new BadRequestException('User does not have permission to approve leaves');
    }
  }

  // Get leaves that need approval by a specific user (based on their role and projects)
  async getLeavesForApproval(userId: string): Promise<Leave[]> {
    this.validateUUID(userId, 'User ID');
    // Get user details and their role
    const user = await this.getUserDetails(userId);
    const roleName = user.role?.name?.toLowerCase();
    
    let pendingLeaves: Leave[] = [];
    let overridableLeaves: Leave[] = [];

    if (roleName === 'superuser') {
      // Superuser can see all pending approvals and override any approved leaves
      pendingLeaves = await this.leaveRepository.find({
        where: [
          { status: 'pending' },
          { status: 'approved_by_lead' },
          { status: 'approved_by_pm' }
        ],
        relations: ['user', 'user.role', 'leaveType'],
        order: { createdAt: 'DESC' }
      });
      
      // Superuser can override leaves approved by admin, manager, projectlead
      overridableLeaves = await this.leaveRepository
        .createQueryBuilder('leave')
        .leftJoinAndSelect('leave.user', 'user')
        .leftJoinAndSelect('leave.user.role', 'userRole')
        .leftJoinAndSelect('leave.leaveType', 'leaveType')
        .where('leave.status = :status', { status: 'approved' })
        .andWhere('userRole.name IN (:...roles)', { 
          roles: ['administrator', 'manager', 'projectlead', 'auditjunior'] 
        })
        .orderBy('leave.createdAt', 'DESC')
        .getMany();
        
    } else if (roleName === 'admin' || roleName === 'administrator') {
      // Admin can see all leaves that need admin approval
      pendingLeaves = await this.leaveRepository.find({
        where: { status: 'approved_by_pm' },
        relations: ['user', 'user.role', 'leaveType'],
        order: { createdAt: 'DESC' }
      });
      
      // Admin can override leaves approved by manager, projectlead
      overridableLeaves = await this.leaveRepository
        .createQueryBuilder('leave')
        .leftJoinAndSelect('leave.user', 'user')
        .leftJoinAndSelect('leave.user.role', 'userRole')
        .leftJoinAndSelect('leave.leaveType', 'leaveType')
        .where('leave.status = :status', { status: 'approved' })
        .andWhere('userRole.name IN (:...roles)', { 
          roles: ['manager', 'projectlead', 'auditjunior'] 
        })
        .orderBy('leave.createdAt', 'DESC')
        .getMany();
        
    } else if (roleName === 'manager') {
      // Manager can see leaves that need manager approval and override projectlead approvals
      const managerProjects = await this.projectRepository.find({
        where: { projectManager: { id: userId } },
        relations: ['users']
      });

      const userIds = managerProjects.flatMap(project => 
        project.users.map(user => user.id)
      );

      if (userIds.length > 0) {
        pendingLeaves = await this.leaveRepository
          .createQueryBuilder('leave')
          .leftJoinAndSelect('leave.user', 'user')
          .leftJoinAndSelect('leave.user.role', 'userRole')
          .leftJoinAndSelect('leave.leaveType', 'leaveType')
          .where('user.id IN (:...userIds)', { userIds })
          .andWhere('leave.status = :status', { status: 'approved_by_lead' })
          .orderBy('leave.createdAt', 'DESC')
          .getMany();
          
        // Manager can override leaves approved by projectlead in their projects
        overridableLeaves = await this.leaveRepository
          .createQueryBuilder('leave')
          .leftJoinAndSelect('leave.user', 'user')
          .leftJoinAndSelect('leave.user.role', 'userRole')
          .leftJoinAndSelect('leave.leaveType', 'leaveType')
          .where('user.id IN (:...userIds)', { userIds })
          .andWhere('leave.status = :status', { status: 'approved' })
          .andWhere('userRole.name IN (:...roles)', { roles: ['projectlead', 'auditjunior'] })
          .orderBy('leave.createdAt', 'DESC')
          .getMany();
      }
      
    } else if (roleName === 'projectlead') {
      // Team leads can see leaves from their project team members that are pending
      const leadProjects = await this.projectRepository.find({
        where: { projectLead: { id: userId } },
        relations: ['users']
      });

      const userIds = leadProjects.flatMap(project => 
        project.users.map(user => user.id)
      );

      if (userIds.length > 0) {
        pendingLeaves = await this.leaveRepository
          .createQueryBuilder('leave')
          .leftJoinAndSelect('leave.user', 'user')
          .leftJoinAndSelect('leave.user.role', 'userRole')
          .leftJoinAndSelect('leave.leaveType', 'leaveType')
          .where('user.id IN (:...userIds)', { userIds })
          .andWhere('leave.status = :status', { status: 'pending' })
          .orderBy('leave.createdAt', 'DESC')
          .getMany();
          
        // Projectlead can override leaves they approved for audit juniors
        overridableLeaves = await this.leaveRepository
          .createQueryBuilder('leave')
          .leftJoinAndSelect('leave.user', 'user')
          .leftJoinAndSelect('leave.user.role', 'userRole')
          .leftJoinAndSelect('leave.leaveType', 'leaveType')
          .where('user.id IN (:...userIds)', { userIds })
          .andWhere('leave.status = :status', { status: 'approved' })
          .andWhere('userRole.name = :role', { role: 'auditjunior' })
          .andWhere('leave.leadApproverId = :leadId', { leadId: userId })
          .orderBy('leave.createdAt', 'DESC')
          .getMany();
      }
    }

    // Combine pending and overridable leaves, mark overridable ones
    const allLeaves = [
      ...pendingLeaves.map(leave => ({ ...leave, canOverride: false })),
      ...overridableLeaves.map(leave => ({ ...leave, canOverride: true }))
    ];
    
    return allLeaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    console.log(`Fetching leaves for User ID:`, userId, `with status:`, status);
    const where: any = { user: { id: userId } };
    if (status && status !== 'all') where.status = status;

    return this.leaveRepository.find({
      where,
      relations: ['leaveType', 'user', 'user.role'],
      order: { createdAt: 'DESC' }
    });
  }

  // Calendar view: get all leaves in a date range, optionally filter by project
  async calendarView(from: string, to: string, projectId?: string): Promise<Leave[]> {
    let query = this.leaveRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.user', 'user')
      .leftJoinAndSelect('leave.leaveType', 'leaveType')
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
