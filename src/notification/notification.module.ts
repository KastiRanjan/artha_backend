import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, UserEntity])],
  controllers: [NotificationController],
  providers: [NotificationService]
})
export class NotificationModule { }
