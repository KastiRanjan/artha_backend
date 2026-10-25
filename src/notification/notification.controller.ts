import { Public } from 'src/common/decorators/public.decorator';
import { SavePushSubscriptionDto } from './dto/push-subscription.dto';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from './enums/notification-type.enum';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Create notification (to all or selected users)
  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  // Get statistics on read notifications eligible for cleanup (e.g. older than 15 days)
  @Get('cleanup/stats')
  getCleanupStats(@Query('days') days?: number) {
    const retentionDays = days ? Number(days) : 15;
    return this.notificationService.getCleanupStats(retentionDays);
  }

  // Trigger cleanup of read notifications older than X days (default 15 days)
  // All deletions are automatically recorded in audit_log
  @Post('cleanup')
  cleanupOldNotifications(
    @Query('days') days?: number,
    @Request() req?: any
  ) {
    const retentionDays = days ? Number(days) : 15;
    const performedBy = req?.user?.id || 'MANUAL_TRIGGER';
    const performedByName = req?.user?.name || req?.user?.email || 'Admin User';
    return this.notificationService.cleanupReadNotifications(retentionDays, performedBy, performedByName);
  }

  // Get notifications for a user with optional type filter
  @Get('user/:userId')
  getUserNotifications(
    @Param('userId') userId: string,
    @Query('type') type?: NotificationType
  ) {
    return this.notificationService.getUserNotifications(userId, type);
  }

  // Mark notification as read for a user
  @Patch('read/:userId/:notificationId')
  markAsRead(@Param('userId') userId: string, @Param('notificationId') notificationId: string) {
    return this.notificationService.markAsRead(userId, notificationId);
  }

  // Mark all notifications of a specific type as read for a user
  @Patch('read-all/:userId/:type')
  markAllAsReadByType(@Param('userId') userId: string, @Param('type') type: NotificationType) {
    return this.notificationService.markAllAsReadByType(userId, type);
  }

  // Mark notification as unread for a user
  @Patch('unread/:userId/:notificationId')
  markAsUnread(@Param('userId') userId: string, @Param('notificationId') notificationId: string) {
    return this.notificationService.markAsUnread(userId, notificationId);
  }

  // Archive notification for a user
  @Patch('archive/:userId/:notificationId')
  archive(@Param('userId') userId: string, @Param('notificationId') notificationId: string) {
    return this.notificationService.archive(userId, notificationId);
  }

  // Delete notification for a user
  @Delete('user/:userId/:notificationId')
  remove(@Param('userId') userId: string, @Param('notificationId') notificationId: string) {
    return this.notificationService.remove(userId, notificationId);
  }

  // Get public VAPID key to initialize browser PushManager subscription
  @Public()
  @Get('push/public-key')
  getVapidPublicKey() {
    return this.notificationService.getVapidPublicKey();
  }

  // Subscribe browser to background OS push notifications
  @Public()
  @Post('push/subscribe')
  savePushSubscription(
    @Body() body: SavePushSubscriptionDto & { userId?: string },
    @Request() req?: any
  ) {
    const userId = req?.user?.id || body.userId;
    return this.notificationService.savePushSubscription(userId, body);
  }

  // Unsubscribe browser from push notifications
  @Public()
  @Post('push/unsubscribe')
  removePushSubscription(@Body() body: { endpoint: string }) {
    return this.notificationService.removePushSubscription(body.endpoint);
  }

  // Send a test push notification to verify OS delivery
  @Public()
  @Post('push/test')
  testPushNotification(
    @Body() body: { userId?: string },
    @Request() req?: any
  ) {
    const userId = req?.user?.id || body.userId;
    return this.notificationService.testPushNotification(userId);
  }

  // Get all users and devices that have enabled background push notifications
  @Public()
  @Get('push/subscribers')
  getPushSubscribers() {
    return this.notificationService.getPushSubscribers();
  }

  // Get all users with their registered push devices for notification targeting
  @Public()
  @Get('push/users-for-target')
  getUsersForNotificationTarget() {
    return this.notificationService.getUsersForNotificationTarget();
  }

  // Send a custom test notification to a specific user with specific message
  @Public()
  @Post('test-custom')
  sendCustomTestNotification(
    @Body() body: {
      userId: string;
      message: string;
      title?: string;
      link?: string;
      type?: NotificationType;
      sendPush?: boolean;
      sendInApp?: boolean;
      deviceId?: string;
    }
  ) {
    return this.notificationService.sendCustomTestNotification(body);
  }
}
