import { Injectable, Inject, forwardRef, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';
import { NotificationGateway } from './notification.gateway';
import { NotificationType } from './enums/notification-type.enum';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { AuditAction, AuditLog } from 'src/audit-log/entities/audit-log.model';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger('NotificationService');

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserNotification)
    private userNotificationRepository: Repository<UserNotification>,
    @Inject(forwardRef(() => NotificationGateway))
    private notificationGateway: NotificationGateway,
    private readonly auditLogService: AuditLogService
  ) {}

  async onModuleInit() {
    try {
      const countRes = await this.notificationRepository.query(
        "SELECT COUNT(*) as count FROM notification WHERE link LIKE '%undefined%' OR link LIKE 'http://localhost%'"
      );
      const invalidCount = parseInt(countRes[0]?.count || '0', 10);
      if (invalidCount > 0) {
        this.logger.log(`Found ${invalidCount} invalid notification links in database. Auto-repairing...`);
        await this.notificationRepository.query(`
          UPDATE notification
          SET link = REGEXP_REPLACE(link, '^(https?:\/\/)?undefined\/?', '/')
          WHERE link LIKE '%undefined%'
        `);
        await this.notificationRepository.query(`
          UPDATE notification
          SET link = REGEXP_REPLACE(link, '^https?:\/\/[^\/]+', '')
          WHERE link LIKE 'http://localhost%'
        `);
        this.logger.log(`Successfully auto-repaired ${invalidCount} notification links.`);
      }
    } catch (err) {
      this.logger.warn(`Notification auto-repair notice: ${err.message}`);
    }
  }

  async create(createNotificationDto: CreateNotificationDto) {
    // Create notification
    const notification = this.notificationRepository.create({
      message: createNotificationDto.message,
      link: createNotificationDto.link,
      type: createNotificationDto.type || NotificationType.GENERAL,
      metadata: createNotificationDto.metadata,
    });
    const savedNotification = await this.notificationRepository.save(notification);

    // Target users: all or specific
    let users: UserEntity[] = [];
    if (!createNotificationDto.users || createNotificationDto.users.length === 0) {
      users = await this.userRepository.find(); // all users
    } else {
      users = await this.userRepository.findByIds(createNotificationDto.users);
    }

    if (!users || users.length === 0) {
      this.logger.warn('No valid users found for notification, skipping user distribution.');
      return savedNotification;
    }

    // Create UserNotification for each user
    for (const user of users) {
      const userNotification = this.userNotificationRepository.create({
        user,
        notification: savedNotification,
        isRead: false,
      });
      await this.userNotificationRepository.save(userNotification);
      // Emit socket event to user
      this.notificationGateway.sendToUser(user.id, 'notification', userNotification);
    }

    // If metadata contains a module, emit to that module room as well for contextual alerts
    if (createNotificationDto.metadata?.module) {
      this.notificationGateway.broadcast(`module_${createNotificationDto.metadata.module}`, {
        type: savedNotification.type,
        message: savedNotification.message,
        metadata: savedNotification.metadata,
        createdAt: savedNotification.createdAt,
      });
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
    let userNotification = await this.userNotificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } }
    });
    if (!userNotification) {
      userNotification = await this.userNotificationRepository.findOne({
        where: { notification: { id: notificationId }, user: { id: userId } }
      });
    }
    if (userNotification) {
      userNotification.isRead = true;
      userNotification.readAt = new Date();
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
      const now = new Date();
      for (const userNotification of userNotifications) {
        userNotification.isRead = true;
        userNotification.readAt = now;
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
      userNotification.readAt = null;
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
      where: { user: { id: userId }, notification: { id: notificationId } },
      relations: ['notification', 'user'],
    });
    if (userNotification) {
      const auditEntry: Partial<AuditLog> = {
        entityName: 'UserNotification',
        tableName: 'user_notification',
        entityId: userNotification.id,
        action: AuditAction.DELETE,
        performedBy: userId,
        performedByName: userNotification.user?.name || userNotification.user?.email || 'User',
        oldValues: {
          id: userNotification.id,
          userId: userNotification.user?.id,
          notificationId: userNotification.notification?.id,
          message: userNotification.notification?.message,
          type: userNotification.notification?.type,
          isRead: userNotification.isRead,
          readAt: userNotification.readAt,
          createdAt: userNotification.createdAt,
        },
        newValues: null,
        changedFields: null,
      };

      const connection = this.userNotificationRepository.manager.connection;
      const queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Enforce strict audit log persistence before deleting
        await this.auditLogService.logBatchStrict([auditEntry]);
        await queryRunner.manager.remove(userNotification);
        await queryRunner.commitTransaction();

        this.notificationGateway.sendToUser(userId, 'notification_deleted', notificationId);
      } catch (err) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`Notification deletion cancelled to prevent data loss: ${err.message}`);
        throw new Error(`Failed to delete notification: ${err.message}. Delete operation was cancelled.`);
      } finally {
        await queryRunner.release();
      }
    }
    return { success: true };
  }

  /**
   * Get statistics of read notifications eligible for cleanup (crossed given days)
   */
  async getCleanupStats(days: number = 15) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const eligibleCount = await this.userNotificationRepository
      .createQueryBuilder('un')
      .where('un.isRead = :isRead', { isRead: true })
      .andWhere(
        '((un.readAt IS NOT NULL AND un.readAt <= :cutoffDate) OR (un.readAt IS NULL AND un.createdAt <= :cutoffDate))',
        { cutoffDate }
      )
      .getCount();

    const oldestRecord = await this.userNotificationRepository
      .createQueryBuilder('un')
      .where('un.isRead = :isRead', { isRead: true })
      .andWhere(
        '((un.readAt IS NOT NULL AND un.readAt <= :cutoffDate) OR (un.readAt IS NULL AND un.createdAt <= :cutoffDate))',
        { cutoffDate }
      )
      .orderBy('un.createdAt', 'ASC')
      .getOne();

    return {
      days,
      cutoffDate,
      eligibleUserNotificationsCount: eligibleCount,
      oldestEligibleCreatedAt: oldestRecord ? oldestRecord.createdAt : null,
    };
  }

  /**
   * Automated & On-Demand Cleanup System:
   * Removes read notifications that have crossed the retention period (default 15 days),
   * and preserves every deletion in the audit_log table before purging.
   */
  async cleanupReadNotifications(
    days: number = 15,
    performedBy: string = 'SYSTEM_CLEANUP',
    performedByName: string = 'Notification 15-Day Cleanup Job'
  ) {
    const startTime = Date.now();
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    this.logger.log(`Starting notification cleanup for read notifications older than ${days} days (cutoff: ${cutoffDate.toISOString()})`);

    let totalUserNotificationsCleaned = 0;
    let totalAuditLogsRecorded = 0;
    const batchSize = 250;

    // 1. Clean eligible UserNotification rows in chunks
    while (true) {
      const batch = await this.userNotificationRepository
        .createQueryBuilder('un')
        .leftJoinAndSelect('un.notification', 'notification')
        .leftJoinAndSelect('un.user', 'user')
        .where('un.isRead = :isRead', { isRead: true })
        .andWhere(
          '((un.readAt IS NOT NULL AND un.readAt <= :cutoffDate) OR (un.readAt IS NULL AND un.createdAt <= :cutoffDate))',
          { cutoffDate }
        )
        .take(batchSize)
        .getMany();

      if (!batch || batch.length === 0) {
        break;
      }

      // Prepare audit log entries for every user_notification being purged
      const auditEntries: Partial<AuditLog>[] = batch.map((un) => ({
        entityName: 'UserNotification',
        tableName: 'user_notification',
        entityId: un.id,
        action: AuditAction.DELETE,
        performedBy,
        performedByName,
        oldValues: {
          id: un.id,
          userId: un.user?.id,
          userEmail: un.user?.email,
          userName: un.user?.name,
          notificationId: un.notification?.id,
          message: un.notification?.message,
          type: un.notification?.type,
          link: un.notification?.link,
          metadata: un.notification?.metadata,
          isRead: un.isRead,
          readAt: un.readAt,
          isArchived: un.isArchived,
          createdAt: un.createdAt,
          updatedAt: un.updatedAt,
        },
        newValues: null,
        changedFields: null,
      }));

      // STRICT TRANSACTIONAL AUDIT DELETION:
      // 1. Audit logs must be persisted first via logBatchStrict. If this fails, it throws immediately.
      // 2. Transaction wraps the deletion so if audit log fails or anything fails, rollback is guaranteed.
      const connection = this.userNotificationRepository.manager.connection;
      const queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const recorded = await this.auditLogService.logBatchStrict(auditEntries);
        totalAuditLogsRecorded += recorded;

        const idsToDelete = batch.map((un) => un.id);
        await queryRunner.manager.delete(UserNotification, idsToDelete);

        await queryRunner.commitTransaction();
        totalUserNotificationsCleaned += idsToDelete.length;
        this.logger.log(`Safely cleaned batch of ${idsToDelete.length} user notifications after securing ${recorded} audit records`);
      } catch (batchErr) {
        await queryRunner.rollbackTransaction();
        this.logger.error(
          `Notification cleanup batch aborted to prevent data loss: ${batchErr.message}. All notifications preserved.`,
          batchErr.stack,
        );
        throw new Error(
          `Notification cleanup aborted to prevent data loss: ${batchErr.message}. No records were deleted.`,
        );
      } finally {
        await queryRunner.release();
      }
    }

    // 2. Clean orphaned Notification rows (no user_notifications remaining)
    let totalParentNotificationsCleaned = 0;
    while (true) {
      const orphanedNotifications = await this.notificationRepository
        .createQueryBuilder('n')
        .leftJoin(UserNotification, 'un', 'un.notificationId = n.id')
        .where('un.id IS NULL')
        .take(batchSize)
        .getMany();

      if (!orphanedNotifications || orphanedNotifications.length === 0) {
        break;
      }

      const orphanAuditEntries: Partial<AuditLog>[] = orphanedNotifications.map((n) => ({
        entityName: 'Notification',
        tableName: 'notification',
        entityId: n.id,
        action: AuditAction.DELETE,
        performedBy,
        performedByName,
        oldValues: {
          id: n.id,
          message: n.message,
          type: n.type,
          link: n.link,
          metadata: n.metadata,
          createdAt: n.createdAt,
        },
        newValues: null,
        changedFields: null,
      }));

      const connection = this.notificationRepository.manager.connection;
      const queryRunner = connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const recorded = await this.auditLogService.logBatchStrict(orphanAuditEntries);
        totalAuditLogsRecorded += recorded;

        const orphanIds = orphanedNotifications.map((n) => n.id);
        await queryRunner.manager.delete(Notification, orphanIds);

        await queryRunner.commitTransaction();
        totalParentNotificationsCleaned += orphanIds.length;
        this.logger.log(`Safely cleaned batch of ${orphanIds.length} orphaned parent notifications after securing ${recorded} audit records`);
      } catch (orphanErr) {
        await queryRunner.rollbackTransaction();
        this.logger.error(
          `Parent notification cleanup aborted to prevent data loss: ${orphanErr.message}. All parent notifications preserved.`,
          orphanErr.stack,
        );
        throw new Error(
          `Parent notification cleanup aborted to prevent data loss: ${orphanErr.message}. No parent notifications were deleted.`,
        );
      } finally {
        await queryRunner.release();
      }
    }

    const durationMs = Date.now() - startTime;
    this.logger.log(
      `Notification cleanup finished in ${durationMs}ms: ${totalUserNotificationsCleaned} user notifications removed, ${totalParentNotificationsCleaned} parent notifications removed, ${totalAuditLogsRecorded} audit logs recorded.`
    );

    return {
      success: true,
      days,
      cutoffDate,
      userNotificationsCleaned: totalUserNotificationsCleaned,
      parentNotificationsCleaned: totalParentNotificationsCleaned,
      auditLogsRecorded: totalAuditLogsRecorded,
      durationMs,
    };
  }

  /**
   * Daily Automated Cron: Runs every day at 2:00 AM to purge read notifications older than 15 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyNotificationCleanupCron() {
    try {
      this.logger.log('Starting automated daily notification cleanup (15-day read notifications)...');
      const result = await this.cleanupReadNotifications(15, 'CRON_SCHEDULER', 'Daily Notification Cleanup Cron');
      this.logger.log(`Automated cleanup completed: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error(`Error in automated notification cleanup cron: ${err.message}`, err.stack);
    }
  }
}
