import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leave } from './entities/leave.entity';
import { LeaveType } from '../leave-type/entities/leave-type.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { UserEntity } from '../auth/entity/user.entity';
import * as moment from 'moment';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>,
    @InjectRepository(LeaveType)
    private readonly leaveTypeRepository: Repository<LeaveType>,
  ) {}

  async create(createLeaveDto: CreateLeaveDto, user: UserEntity): Promise<Leave> {
    // Validate leave type exists and is active
    const leaveType = await this.leaveTypeRepository.findOne({
      where: { name: createLeaveDto.type, isActive: true }
    });

    if (!leaveType) {
      throw new BadRequestException(`Invalid or inactive leave type: ${createLeaveDto.type}`);
    }

    // Calculate requested days
    const startDate = moment(createLeaveDto.startDate);
    const endDate = moment(createLeaveDto.endDate);
    const requestedDays = endDate.diff(startDate, 'days') + 1;

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

    const leave = this.leaveRepository.create({ 
      ...createLeaveDto, 
      status: 'pending',
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
      const leaveStart = moment(leave.startDate);
      const leaveEnd = moment(leave.endDate);
      const yearStart = moment(startOfYear);
      const yearEnd = moment(endOfYear);
      
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
    const leave = await this.findOne(id);
    if (leave.status !== 'pending') throw new BadRequestException('Leave not pending');
    leave.status = 'approved_by_lead';
    leave.leadApproverId = userId;
    return this.leaveRepository.save(leave);
  }

  async approveByPM(id: string, userId: string): Promise<Leave> {
    const leave = await this.findOne(id);
    if (leave.status !== 'approved_by_lead') throw new BadRequestException('Leave not approved by lead');
    leave.status = 'approved_by_pm';
    leave.pmApproverId = userId;
    return this.leaveRepository.save(leave);
  }

  async approveByAdmin(id: string, userId: string): Promise<Leave> {
    const leave = await this.findOne(id);
    if (leave.status !== 'approved_by_pm') throw new BadRequestException('Leave not approved by PM');
    leave.status = 'approved';
    leave.adminApproverId = userId;
    return this.leaveRepository.save(leave);
  }

  async reject(id: string, userId: string): Promise<Leave> {
    const leave = await this.findOne(id);
    leave.status = 'rejected';
    // Optionally track who rejected
    return this.leaveRepository.save(leave);
  }

  // Calendar view: get all leaves in a date range, optionally filter by project
  async calendarView(from: string, to: string, projectId?: string): Promise<Leave[]> {
    // For now, just return all leaves in range; project filter can be added if relation exists
    return this.leaveRepository.createQueryBuilder('leave')
      .where('leave.startDate <= :to AND leave.endDate >= :from', { from, to })
      .getMany();
  }
}
