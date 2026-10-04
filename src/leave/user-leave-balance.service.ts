import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserLeaveBalance } from './entities/user-leave-balance.entity';
import {
  LeaveBalanceLedger,
  LeaveLedgerAction,
  LeaveLedgerChangeType,
} from './entities/leave-balance-ledger.entity';
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
    @InjectRepository(LeaveBalanceLedger)
    private readonly ledgerRepository: Repository<LeaveBalanceLedger>,
    @InjectRepository(LeaveType)
    private readonly leaveTypeRepository: Repository<LeaveType>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Helper to append an immutable audit log entry into the ledger
   */
  private async recordLedgerEntry(params: {
    userId: string;
    leaveTypeId: string;
    year: number;
    action: LeaveLedgerAction;
    changeType: LeaveLedgerChangeType;
    days: number;
    resultingBalance: number;
    referenceId?: string;
    remarks?: string;
    createdById?: string;
  }): Promise<LeaveBalanceLedger> {
    const entry = this.ledgerRepository.create({
      userId: params.userId,
      leaveTypeId: params.leaveTypeId,
      year: params.year,
      action: params.action,
      changeType: params.changeType,
      days: params.days,
      resultingBalance: params.resultingBalance,
      referenceId: params.referenceId,
      remarks: params.remarks,
      createdById: params.createdById,
    });
    return this.ledgerRepository.save(entry);
  }

  /**
   * Allocate leave to a user for a specific year
   */
  async allocateLeave(
    allocateLeaveDto: AllocateLeaveDto,
    allocatedById?: string,
  ): Promise<UserLeaveBalance> {
    const { userId, leaveTypeId, year, allocatedDays, carriedOverDays = 0 } = allocateLeaveDto;

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validate leave type exists
    const leaveType = await this.leaveTypeRepository.findOne({
      where: { id: leaveTypeId, isActive: true },
    });
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${leaveTypeId} not found or inactive`);
    }

    // Check if allocation already exists
    let balance = await this.userLeaveBalanceRepository.findOne({
      where: { userId, leaveTypeId, year },
    });

    const isNew = !balance;
    const oldAllocated = balance ? Number(balance.allocatedDays) : 0;

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
        pendingDays: 0,
      });
    }

    const savedBalance = await this.userLeaveBalanceRepository.save(balance);

    // Record audit in ledger
    const delta = isNew ? allocatedDays : allocatedDays - oldAllocated;
    await this.recordLedgerEntry({
      userId,
      leaveTypeId,
      year,
      action: isNew ? LeaveLedgerAction.ALLOCATION : LeaveLedgerAction.MANUAL_ADJUSTMENT,
      changeType: delta >= 0 ? LeaveLedgerChangeType.CREDIT : LeaveLedgerChangeType.DEBIT,
      days: Math.abs(delta),
      resultingBalance: savedBalance.remainingDays,
      remarks: isNew
        ? `Initial allocation of ${allocatedDays} days for year ${year}`
        : `Allocation adjusted from ${oldAllocated} to ${allocatedDays} days`,
      createdById: allocatedById,
    });

    return savedBalance;
  }

  /**
   * Allocate leave to all active users for a specific leave type
   */
  async allocateLeaveToAllUsers(
    leaveTypeId: string,
    year: number,
    allocatedDays: number,
    allocatedById?: string,
  ): Promise<UserLeaveBalance[]> {
    // Validate leave type
    const leaveType = await this.leaveTypeRepository.findOne({
      where: { id: leaveTypeId, isActive: true },
    });
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${leaveTypeId} not found or inactive`);
    }

    // Get all active users
    const users = await this.userRepository.find({
      where: { status: 'active' },
    });

    const balances: UserLeaveBalance[] = [];

    for (const user of users) {
      const balance = await this.allocateLeave(
        {
          userId: user.id,
          leaveTypeId,
          year,
          allocatedDays,
        },
        allocatedById,
      );
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
    year: number,
  ): Promise<UserLeaveBalance | null> {
    const balance = await this.userLeaveBalanceRepository.findOne({
      where: { userId, leaveTypeId, year },
      relations: ['user', 'leaveType'],
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
    days: number,
    leaveId?: string,
    approvedById?: string,
  ): Promise<void> {
    const balance = await this.getUserLeaveBalance(userId, leaveTypeId, year);

    if (!balance) {
      throw new NotFoundException(
        `No leave balance found for user ${userId}, leave type ${leaveTypeId}, year ${year}`,
      );
    }

    balance.usedDays = Number(balance.usedDays) + days;
    balance.pendingDays = Math.max(0, Number(balance.pendingDays) - days);

    const savedBalance = await this.userLeaveBalanceRepository.save(balance);

    // Record consumption in ledger
    await this.recordLedgerEntry({
      userId,
      leaveTypeId,
      year,
      action: LeaveLedgerAction.LEAVE_CONSUMPTION,
      changeType: LeaveLedgerChangeType.DEBIT,
      days,
      resultingBalance: savedBalance.remainingDays,
      referenceId: leaveId,
      remarks: `Leave approved: converted ${days} pending day(s) to used day(s)`,
      createdById: approvedById,
    });
  }

  /**
   * Update pending days when leave is requested
   */
  async updatePendingDays(
    userId: string,
    leaveTypeId: string,
    year: number,
    days: number,
    leaveId?: string,
  ): Promise<void> {
    const balance = await this.getUserLeaveBalance(userId, leaveTypeId, year);

    if (!balance) {
      throw new NotFoundException(
        `No leave balance found for user ${userId}, leave type ${leaveTypeId}, year ${year}`,
      );
    }

    balance.pendingDays = Number(balance.pendingDays) + days;

    const savedBalance = await this.userLeaveBalanceRepository.save(balance);

    // Record hold reservation in ledger
    await this.recordLedgerEntry({
      userId,
      leaveTypeId,
      year,
      action: LeaveLedgerAction.LEAVE_RESERVATION,
      changeType: LeaveLedgerChangeType.HOLD,
      days,
      resultingBalance: savedBalance.remainingDays,
      referenceId: leaveId,
      remarks: `Leave requested: reserved ${days} day(s) as pending`,
    });
  }

  /**
   * Revert pending days when leave is rejected, deleted, or cancelled
   */
  async revertPendingDays(
    userId: string,
    leaveTypeId: string,
    year: number,
    days: number,
    leaveId?: string,
    action: LeaveLedgerAction = LeaveLedgerAction.LEAVE_CANCELLATION,
    actorId?: string,
  ): Promise<void> {
    const balance = await this.getUserLeaveBalance(userId, leaveTypeId, year);

    if (balance) {
      balance.pendingDays = Math.max(0, Number(balance.pendingDays) - days);
      const savedBalance = await this.userLeaveBalanceRepository.save(balance);

      // Record release in ledger
      await this.recordLedgerEntry({
        userId,
        leaveTypeId,
        year,
        action,
        changeType: LeaveLedgerChangeType.RELEASE,
        days,
        resultingBalance: savedBalance.remainingDays,
        referenceId: leaveId,
        remarks:
          action === LeaveLedgerAction.LEAVE_REJECTION
            ? `Leave rejected: released ${days} pending day(s) back to available`
            : `Leave cancelled/modified: released ${days} pending day(s)`,
        createdById: actorId,
      });
    }
  }

  /**
   * Carry over unused leave to next year
   */
  async carryOverLeave(
    carryOverDto: CarryOverLeaveDto,
    performedById?: string,
  ): Promise<{
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
      where: leaveTypeFilter,
    });

    if (leaveTypes.length === 0) {
      throw new BadRequestException('No leave types found that allow carry over');
    }

    // Get users to process
    let users: UserEntity[];
    if (userIds && userIds.length > 0) {
      users = await this.userRepository.find({
        where: { id: In(userIds), status: 'active' },
      });
    } else {
      users = await this.userRepository.find({
        where: { status: 'active' },
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
              message: `No balance found for year ${fromYear}`,
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
              message: 'No remaining days to carry over',
            });
            continue;
          }

          let daysToCarryOver = remainingDays;
          if (leaveType.maxCarryOverDays && leaveType.maxCarryOverDays > 0) {
            daysToCarryOver = Math.min(remainingDays, leaveType.maxCarryOverDays);
          }

          let newBalance = await this.getUserLeaveBalance(user.id, leaveType.id, toYear);

          if (newBalance) {
            newBalance.carriedOverDays = Number(newBalance.carriedOverDays) + daysToCarryOver;
            await this.userLeaveBalanceRepository.save(newBalance);
          } else {
            newBalance = this.userLeaveBalanceRepository.create({
              userId: user.id,
              leaveTypeId: leaveType.id,
              year: toYear,
              allocatedDays: 0,
              carriedOverDays: daysToCarryOver,
              usedDays: 0,
              pendingDays: 0,
            });
            await this.userLeaveBalanceRepository.save(newBalance);
          }

          // Record carry over in ledger
          await this.recordLedgerEntry({
            userId: user.id,
            leaveTypeId: leaveType.id,
            year: toYear,
            action: LeaveLedgerAction.CARRY_OVER,
            changeType: LeaveLedgerChangeType.CREDIT,
            days: daysToCarryOver,
            resultingBalance: newBalance.remainingDays,
            remarks: `Carried over ${daysToCarryOver} unused day(s) from year ${fromYear} to ${toYear}`,
            createdById: performedById,
          });

          successCount++;
          details.push({
            userId: user.id,
            userName: user.name,
            leaveType: leaveType.name,
            status: 'success',
            carriedOverDays: daysToCarryOver,
            fromYear,
            toYear,
          });
        } catch (error) {
          failedCount++;
          details.push({
            userId: user.id,
            userName: user.name,
            leaveType: leaveType.name,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      details,
    };
  }

  /**
   * Check if user has sufficient leave balance
   */
  async checkSufficientBalance(
    userId: string,
    leaveTypeId: string,
    year: number,
    requestedDays: number,
  ): Promise<{ sufficient: boolean; available: number; message?: string }> {
    const balance = await this.getUserLeaveBalance(userId, leaveTypeId, year);

    if (!balance) {
      return {
        sufficient: false,
        available: 0,
        message: `No leave allocation found for this leave type in year ${year}`,
      };
    }

    const availableDays = balance.remainingDays;

    if (availableDays < requestedDays) {
      return {
        sufficient: false,
        available: availableDays,
        message: `Insufficient leave balance. Available: ${availableDays} days, Requested: ${requestedDays} days`,
      };
    }

    return {
      sufficient: true,
      available: availableDays,
    };
  }

  /**
   * Retrieve immutable audit ledger entries for a user
   */
  async getLedgerEntries(
    userId: string,
    year?: number,
    leaveTypeId?: string,
  ): Promise<LeaveBalanceLedger[]> {
    const query = this.ledgerRepository
      .createQueryBuilder('ledger')
      .leftJoinAndSelect('ledger.leaveType', 'leaveType')
      .where('ledger.userId = :userId', { userId });

    if (year) {
      query.andWhere('ledger.year = :year', { year });
    }

    if (leaveTypeId) {
      query.andWhere('ledger.leaveTypeId = :leaveTypeId', { leaveTypeId });
    }

    query.orderBy('ledger.createdAt', 'DESC');

    return query.getMany();
  }
}
