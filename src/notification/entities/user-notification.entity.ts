import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Notification } from './notification.entity';

@Entity()
export class UserNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, user => user.userNotifications, { eager: true })
  user: UserEntity;

  @ManyToOne(() => Notification, { eager: true })
  notification: Notification;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
