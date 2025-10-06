import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

export enum HistoryActionType {
  ROLE_CHANGE = 'role_change',
  PROFILE_UPDATE = 'profile_update',
  DEPARTMENT_CHANGE = 'department_change',
  LEAVE_BALANCE_UPDATE = 'leave_balance_update',
  CONTRACT_UPDATE = 'contract_update',
  STATUS_CHANGE = 'status_change',
  VERIFICATION = 'verification',
  OTHER = 'other'
}

/**
 * User History Entity
 * Tracks important changes to user data
 */
@Entity({
  name: 'user_history'
})
export class UserHistoryEntity extends CustomBaseEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn()
  modifiedBy: UserEntity;

  @Column({ nullable: true })
  modifiedById: string;

  @Column({
    type: 'enum',
    enum: HistoryActionType,
    default: HistoryActionType.OTHER
  })
  actionType: HistoryActionType;

  @Column({ length: 255 })
  field: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string;

  @Column({ type: 'text', nullable: true })
  newValue: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}