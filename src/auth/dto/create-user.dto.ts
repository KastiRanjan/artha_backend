import { OmitType } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

import { RegisterUserDto } from 'src/auth/dto/register-user.dto';
import { UserStatusEnum } from 'src/auth/user-status.enum';

const statusEnumArray = [
  UserStatusEnum.ACTIVE,
  UserStatusEnum.INACTIVE,
  UserStatusEnum.BLOCKED
];

/**
 * create user data transform object
 */
export class CreateUserDto extends OmitType(RegisterUserDto, [
  'password'
] as const) {
  @IsIn(statusEnumArray, {
    message: `isIn-{"items":"${statusEnumArray.join(',')}"}`
  })
  status: UserStatusEnum;

  @IsString()
  roleId: string;
  
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;
}
