import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class PushSubscriptionKeysDto {
  @ApiProperty({ description: 'p256dh public key' })
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @ApiProperty({ description: 'auth secret' })
  @IsString()
  @IsNotEmpty()
  auth: string;
}

export class SavePushSubscriptionDto {
  @ApiProperty({ description: 'Subscription endpoint URL provided by browser push service' })
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @ApiProperty({ description: 'Encryption keys (p256dh and auth)' })
  @IsObject()
  @IsNotEmpty()
  keys: PushSubscriptionKeysDto;

  @ApiProperty({ description: 'User agent / browser signature', required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
