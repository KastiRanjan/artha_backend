import { IsBoolean, IsNumber, IsArray, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMailSettingsDto {
  @ApiProperty({ description: 'Enable/disable all attendance reminders', required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ description: 'Enable/disable clock-in reminders', required: false })
  @IsOptional()
  @IsBoolean()
  clockInRemindersEnabled?: boolean;

  @ApiProperty({ description: 'Enable/disable clock-out reminders', required: false })
  @IsOptional()
  @IsBoolean()
  clockOutRemindersEnabled?: boolean;

  @ApiProperty({ description: 'Grace period in minutes before sending reminder', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gracePeriodMinutes?: number;

  @ApiProperty({ description: 'Cron schedule for checking reminders (e.g., */15 * * * *)', required: false })
  @IsOptional()
  @IsString()
  cronSchedule?: string;

  @ApiProperty({ description: 'Roles to exclude from reminders', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedRoles?: string[];

  @ApiProperty({ description: 'Description of the setting', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
