import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserHistoryEntity, HistoryActionType } from '../entities/user.history.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Injectable()
export class UserHistoryService {
  constructor(
    @InjectRepository(UserHistoryEntity)
    private userHistoryRepository: Repository<UserHistoryEntity>
  ) {}

  /**
   * Create a new history record
   */
  async createHistoryRecord(
    user: UserEntity,
    modifiedBy: UserEntity,
    actionType: HistoryActionType,
    field: string,
    oldValue: any,
    newValue: any,
    description?: string
  ): Promise<UserHistoryEntity> {
    // Format values to store as strings if they are objects
    const formattedOldValue = typeof oldValue === 'object' && oldValue !== null 
      ? JSON.stringify(oldValue) 
      : String(oldValue || '');
      
    const formattedNewValue = typeof newValue === 'object' && newValue !== null 
      ? JSON.stringify(newValue) 
      : String(newValue || '');

    const history = this.userHistoryRepository.create({
      user,
      userId: user.id,
      modifiedBy,
      modifiedById: modifiedBy.id,
      actionType,
      field,
      oldValue: formattedOldValue,
      newValue: formattedNewValue,
      description
    });

    return this.userHistoryRepository.save(history);
  }

  /**
   * Get history records for a user
   */
  async getUserHistory(userId: string): Promise<UserHistoryEntity[]> {
    return this.userHistoryRepository.find({
      where: { userId },
      relations: ['modifiedBy'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get filtered history records for a user
   */
  async getFilteredUserHistory(
    userId: string, 
    actionTypes?: HistoryActionType[], 
    startDate?: Date,
    endDate?: Date
  ): Promise<UserHistoryEntity[]> {
    const query = this.userHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.modifiedBy', 'modifiedBy')
      .where('history.userId = :userId', { userId })
      .orderBy('history.createdAt', 'DESC');

    if (actionTypes && actionTypes.length > 0) {
      query.andWhere('history.actionType IN (:...actionTypes)', { actionTypes });
    }

    if (startDate) {
      query.andWhere('history.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('history.createdAt <= :endDate', { endDate });
    }

    return query.getMany();
  }
}