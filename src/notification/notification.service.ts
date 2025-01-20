import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>
  ) {}
  async create(createNotificationDto: CreateNotificationDto) {
    const users = await this.userRepository.findByIds(
      createNotificationDto.users
    );

    const notification = await this.notificationRepository.create({
      ...createNotificationDto,
      users
    });

    return await this.notificationRepository.save(notification);
  }

  findAll() {
    return this.notificationRepository.find({
      where: { isRead: false },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    return await this.notificationRepository.find({
      where: { userId: id },
      order: { createdAt: 'DESC' }
    });
  }

  async markNotificationAsReadupdate(id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: id }
    });
    if (notification) {
      notification.isRead = true;
      await this.notificationRepository.save(notification);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
