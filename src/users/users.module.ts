import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { UserEntity } from 'src/auth/entity/user.entity';
import { UserProfileEntity } from './entities/user.profile.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule, LoginThrottleFactory } from 'src/auth/auth.module';
import { UserRepository } from 'src/auth/user.repository';
import { MailService } from 'src/mail/mail.service';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { RefreshTokenRepository } from 'src/refresh-token/refresh-token.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserProfileEntity,
      UserRepository,
      RefreshTokenRepository
    ]),
    AuthModule
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    AuthService,
    MailService,
    RefreshTokenService,
    LoginThrottleFactory
  ],
  exports: [UsersService]
})
export class UsersModule {}
