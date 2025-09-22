import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeBoardService } from './notice-board.service';
import { NoticeBoardController } from './notice-board.controller';
import { NoticeBoard } from './entities/notice-board.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { RoleEntity } from 'src/role/entities/role.entity';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NoticeBoard, UserEntity, RoleEntity]),
    MailModule
  ],
  controllers: [NoticeBoardController],
  providers: [NoticeBoardService],
  exports: [NoticeBoardService]
})
export class NoticeBoardModule {}