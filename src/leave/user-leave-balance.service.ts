import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserLeaveBalance } from './entities/user-leave-balance.entity';
import { LeaveType } from '../leave-type/entities/leave-type.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { AllocateLeaveDto } from './dto/allocate-leave.dto';
import { CarryOverLeaveDto } from './dto/carry-over-leave.dto';
import * as moment from 'moment';

@Injectable()
export class UserLeaveBalanceService {
  constructor(
    @InjectRepository(UserLeaveBalance)
    private readonly userLeaveBalanceRepository: Repository<UserLeaveBalance>,
    @InjectRepository(LeaveType)
    private readonly leaveTypeRepository: Repository<LeaveType>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Allocate leave to a user for a specific year
   */
  async allocateLeave(allocateLeaveDto: AllocateLeaveDto): Promise<UserLeaveBalance> {
    const { userId, leaveTypeId, year, allocatedDays, carriedOverDays = 0 } = allocateLeaveDto;

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validate leave type exists
    const leaveType = await this.leaveTypeRepository.findOne({ 
      where: { id: leaveTypeId, isActive: true } 
    });
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${leaveTypeId} not found or inactive`);
    }

    // Check if allocation already exists
    let balance = await this.userLeaveBalanceRepository.findOne({
      where: { userId, leaveTypeId, year }
    });

    if (balance) {
      // Update existing allocation
      balance.allocatedDays = allocatedDays;
      balance.carriedOverDays = carriedOverDays || balance.carriedOverDays;
    } else {
      // Create new allocation
      balance = this.userLeaveBalanceRepository.create({
        userId,
        leaveTypeId,
        year,
        allocatedDays,
        carriedOverDays,
        usedDays: 0,
        pendingDays: 0
      });
    }

    return this.userLeaveBalanceRepository.save(balance);
  }

  /**
   * Allocate leave to all active users for a specific leave type
   */
  async allocateLeaveToAllUsers(
    leaveTypeId: string, 
    year: number, 
    allocatedDays: number
  ): Promise<UserLeaveBalance[]> {
    // Validate leave type
    const leaveType = await this.leaveTypeRepository.findOne({ 
      where: { id: leaveTypeId, isActive: true } 
    });
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${leaveTypeId} not found or inactive`);
    }

    // Get all active users
    const users = await this.userRepository.find({
      where: { status: 'active' }
    });

    const balances: UserLeaveBalance[] = [];
    
    for (const user of users) {
      const balance = await this.allocateLeave({
        userId: user.id,
        leaveTypeId,
        year,
        allocatedDays
      });
      balances.push(balance);
    }

    return balances;
  }

  /**
   * Get user leave balance for a specific leave type and year
   */
  async getUserLeaveBalance(
    userId: string, 
    leaveTypeId: string, 
    year: number
  ): Promise<UserLeaveBalance | null> {
    const balance = await this.userLeaveBalanceRepository.findOne({
      where: { userId, leaveTypeId, year },
      relations: ['user', 'leaveType']
    });

    return balance;
  }

  /**
   * Get all leave balances for a user in a specific year
   */
  async getUserAllLeaveBalances(userId: string, year: number): Promise<UserLeaveBalance[]> {
    const balances = await this.userLeaveBalanceRepository
      .createQueryBuilder('balance')
      .leftJoinAndSelect('balance.leaveType', 'leaveType')
      .where('balance.userId = :userId', { userId })
      .andWhere('balance.year = :year', { year })
      .orderBy('leaveType.name', 'ASC')
      .getMany();

    return balances;
  }

  /**
   * Update used days when leave is approved
   */
  async updateUsedDays(
    userId: string, 
    leaveTypeId: string, 
    year: number, 
    days: number
  ): Promise<void> {
    const balance = await this.getUserLeaveBalance(userId, leaveTypeId, year);
    
    if (!balance) {
      throw new NotFoundException(
        `No leave balance found for user ${userId}, leave type ${leaveTypeId}, year ${year}`
      );
    }

    balance.usedDays = Number(balance.usedDays) + days;
    balance.pendingDays = Math.max(0, Number(balance.pendingDays) - days);
    
    await this.userLeaveBalanceRepository.save(balance);
  }

  /**
   * Update pending days when leave is requested
   */
  async updatePendingDays(
    userId: string, 
    leaveTypeId: string, 
    year: number, 
    days: number
  ): Promise<void> {
    const balance = await this.getUserLeaveBalance(userId, leaveTypeId, year);
    
    if (!balance) {
      throw new NotFoundException(
        `No leave balance found for user ${userId}, leave type ${leaveTypeId}, year ${year}`
      );
    }

    balance.pendingDays = Number(balance.pendingDays) + days;
    
    await this.userLeaveBalanceRepository.save(balance);
  }

  /**
   * Revert pending days when leave is rejected or deleted
   */
  async revertPendingDays(
    userId: string, 
    leaveTypeId: string, 
    year: number, 
    days: number
  ): Promise<void> {
    const balance = await this.getUserLeaveBalance(userId, leaveTypeId, year);
    
    if (balance) {
      balance.pendingDays = Math.max(0, Number(balance.pendingDays) - days);
      await this.userLeaveBalanceRepository.save(balance);
    }
  }

  /**
   * Carry over unused leave to next year
   */
  async carryOverLeave(carryOverDto: CarryOverLeaveDto): Promise<{
    success: number;
    failed: number;
    details: any[];
  }> {
    const { userIds, fromYear, toYear, leaveTypeIds } = carryOverDto;

    if (toYear <= fromYear) {
      throw new BadRequestException('toYear must be greater than fromYear');
    }

    // Get leave types that allow carry over
    const leaveTypeFilter: any = { isActive: true, allowCarryOver: true };
    if (leaveTypeIds && leaveTypeIds.length > 0) {
      leaveTypeFilter.id = In(leaveTypeIds);
    }
    
    const leaveTypes = await this.leaveTypeRepository.find({
      where: leaveTypeFilter
    });

    if (leaveTypes.length === 0) {
      throw new BadRequestException('No leave types found that allow carry over');
    }

    // Get users to process
    let users: UserEntity[];
    if (userIds && userIds.length > 0) {
      users = await this.userRepository.find({
        where: { id: In(userIds), status: 'active' }
      });
    } else {
      users = await this.userRepository.find({
        where: { status: 'active' }
      });
    }

    const details: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const user of users) {
      for (const leaveType of leaveTypes) {
        try {
          const oldBalance = await this.getUserLeaveBalance(user.id, leaveType.id, fromYear);
          
          if (!oldBalance) {
            details.push({
              userId: user.id,
              userName: user.name,
              leaveType: leaveType.name,
              status: 'skipped',
              message: 'No balance found for previous year'
            });
            continue;
          }

          const remainingDays = oldBalance.remainingDays;
          
          if (remainingDays <= 0) {
            details.push({
              userId: user.id,
              userName: user.name,
              leaveType: leaveType.name,
              status: 'skipped',
              message: 'No remaining days to carry over'
            });
            continue;
          }

          // Calculate days to carry over
          let daysToCarryOver = remainingDays;
          if (leaveType.maxCarryOverDays && leaveType.maxCarryOverDays > 0) {
            daysToCarryOver = Math.min(remainingDays, leaveType.maxCarryOverDays);
          }

          // Check if allocation exists for new year
          let newBalance = await this.getUserLeaveBalance(user.id, leaveType.id, toYear);
          
          if (newBalance) {
            // Update existing allocation
            newBalance.carriedOverDays = daysToCarryOver;
            await this.userLeaveBalanceRepository.save(newBalance);
          } else {
            // Create new allocation with carry over
            await this.allocateLeave({
              userId: user.id,
              leaveTypeId: leaveType.id,
              year: toYear,
              allocatedDays: leaveType.maxDaysPerYear || 0,
              carriedOverDays: daysToCarryOver
            });
          }

          successCount++;
          details.push({
            userId: user.id,
            userName: user.name,
            leaveType: leaveType.name,
            status: 'success',
            carriedOverDays: daysToCarryOver
          });
        } catch (error) {
          failedCount++;
          details.push({
            userId: user.id,
            userName: user.name,
            leaveType: leaveType.name,
            status: 'failed',
            error: error.message
          });
        }
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      details
    };
  }

  /**
   * Check if user has sufficient leave balance
   */
  async checkSufficientBalance(
    userId: string,
    leaveTypeId: string,
    year: number,
    requestedDays: number
  ): Promise<{ sufficient: boolean; available: number; message?: string }> {
    const balance = await this.getUserLeaveBalance(userId, leaveTypeId, year);
    
    if (!balance) {
      return {
        sufficient: false,
        available: 0,
        message: `No leave allocation found for this leave type in year ${year}`
      };
    }

    const availableDays = balance.remainingDays;
    
    if (availableDays < requestedDays) {
      return {
        sufficient: false,
        available: availableDays,
        message: `Insufficient leave balance. Available: ${availableDays} days, Requested: ${requestedDays} days`
      };
    }

    return {
      sufficient: true,
      available: availableDays
    };
  }
}
