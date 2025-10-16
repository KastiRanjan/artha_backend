import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';
import { NotificationGateway } from './notification.gateway';
import { NotificationType } from './enums/notification-type.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
  private notificationRepository: Repository<Notification>,
  @InjectRepository(UserEntity)
  private userRepository: Repository<UserEntity>,
  @InjectRepository(UserNotification)
  private userNotificationRepository: Repository<UserNotification>,
  @Inject(forwardRef(() => NotificationGateway))
  private notificationGateway: NotificationGateway
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    // Create notification
    const notification = this.notificationRepository.create({
      message: createNotificationDto.message,
      link: createNotificationDto.link,
      type: createNotificationDto.type || NotificationType.GENERAL,
    });
    const savedNotification = await this.notificationRepository.save(notification);

    // Target users: all or specific
    let users: UserEntity[] = [];
    if (!createNotificationDto.users || createNotificationDto.users.length === 0) {
      users = await this.userRepository.find(); // all users
    } else {
      users = await this.userRepository.findByIds(createNotificationDto.users);
    }
    // Debug log
    if (!users || users.length === 0) {
      console.warn('No valid users found for notification, skipping creation.');
      return savedNotification;
    }
    // Create UserNotification for each user
    for (const user of users) {
      const userNotification = this.userNotificationRepository.create({
        user,
        notification: savedNotification,
      });
      await this.userNotificationRepository.save(userNotification);
      // Emit socket event to user
      this.notificationGateway.sendToUser(user.id, 'notification', userNotification);
    }
    return savedNotification;
  }

  async getUserNotifications(userId: string, type?: NotificationType) {
    const queryBuilder = this.userNotificationRepository
      .createQueryBuilder('userNotification')
      .leftJoinAndSelect('userNotification.notification', 'notification')
      .leftJoinAndSelect('userNotification.user', 'user')
      .where('user.id = :userId', { userId })
      .orderBy('userNotification.createdAt', 'DESC');

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    return queryBuilder.getMany();
  }

  async markAsRead(userId: string, notificationId: string) {
    const userNotification = await this.userNotificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } }
    });
    if (userNotification) {
      userNotification.isRead = true;
      await this.userNotificationRepository.save(userNotification);
      this.notificationGateway.sendToUser(userId, 'notification_read', userNotification);
    }
    return userNotification;
  }

  async markAllAsReadByType(userId: string, type: NotificationType) {
    const queryBuilder = this.userNotificationRepository
      .createQueryBuilder('userNotification')
      .leftJoinAndSelect('userNotification.notification', 'notification')
      .leftJoinAndSelect('userNotification.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('userNotification.isRead = :isRead', { isRead: false })
      .andWhere('notification.type = :type', { type });

    const userNotifications = await queryBuilder.getMany();
    
    if (userNotifications && userNotifications.length > 0) {
      for (const userNotification of userNotifications) {
        userNotification.isRead = true;
        await this.userNotificationRepository.save(userNotification);
      }
      this.notificationGateway.sendToUser(userId, 'notification_bulk_read', { type, count: userNotifications.length });
    }
    
    return { success: true, count: userNotifications.length };
  }

  async markAsUnread(userId: string, notificationId: string) {
    const userNotification = await this.userNotificationRepository.findOne({
      where: { user: { id: userId }, notification: { id: notificationId } }
    });
    if (userNotification) {
      userNotification.isRead = false;
      await this.userNotificationRepository.save(userNotification);
      this.notificationGateway.sendToUser(userId, 'notification_unread', userNotification);
    }
    return userNotification;
  }

  async archive(userId: string, notificationId: string) {
    const userNotification = await this.userNotificationRepository.findOne({
      where: { user: { id: userId }, notification: { id: notificationId } }
    });
    if (userNotification) {
      userNotification.isArchived = true;
      await this.userNotificationRepository.save(userNotification);
      this.notificationGateway.sendToUser(userId, 'notification_archived', userNotification);
    }
    return userNotification;
  }

  async remove(userId: string, notificationId: string) {
    const userNotification = await this.userNotificationRepository.findOne({
      where: { user: { id: userId }, notification: { id: notificationId } }
    });
    if (userNotification) {
      await this.userNotificationRepository.remove(userNotification);
      this.notificationGateway.sendToUser(userId, 'notification_deleted', notificationId);
    }
    return { success: true };
  }
}
