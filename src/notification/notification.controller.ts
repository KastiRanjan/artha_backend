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
}
