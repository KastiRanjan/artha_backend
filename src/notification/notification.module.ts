import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { UserNotification } from './entities/user-notification.entity';
import { PushSubscriptionEntity } from './entities/push-subscription.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { NotificationGateway } from './notification.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { AuditLogModule } from 'src/audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, UserEntity, UserNotification, PushSubscriptionEntity]),
    AuthModule,
    AuditLogModule
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService, TypeOrmModule, NotificationGateway, AuditLogModule]
})
export class NotificationModule {}
