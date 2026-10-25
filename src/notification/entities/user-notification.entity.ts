import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Notification } from './notification.entity';

@Entity()
export class UserNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, user => user.userNotifications, { eager: true, onDelete: 'CASCADE' })
  user: UserEntity;

  @ManyToOne(() => Notification, { eager: true, onDelete: 'CASCADE' })
  notification: Notification;

  @Index()
  @Column({ default: false })
  isRead: boolean;

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Index()
  @Column({ default: false })
  isArchived: boolean;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
