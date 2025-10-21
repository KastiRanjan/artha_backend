import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailSettings } from './entities/mail-settings.entity';
import { UpdateMailSettingsDto } from './dto/update-mail-settings.dto';
import { UserEntity } from 'src/auth/entity/user.entity';

@Injectable()
export class MailSettingsService {
  private readonly logger = new Logger(MailSettingsService.name);

  constructor(
    @InjectRepository(MailSettings)
    private readonly mailSettingsRepository: Repository<MailSettings>,
  ) {}

  /**
   * Get mail settings (creates default if not exists)
   */
  async getSettings(): Promise<MailSettings> {
    let settings = await this.mailSettingsRepository.findOne({
      where: { settingKey: 'attendance_reminders' },
    });

    if (!settings) {
      // Create default settings
      settings = this.mailSettingsRepository.create({
        settingKey: 'attendance_reminders',
        enabled: true,
        clockInRemindersEnabled: true,
        clockOutRemindersEnabled: true,
        gracePeriodMinutes: 60,
        cronSchedule: '*/15 * * * *',
        excludedRoles: ['super_user', 'admin', 'administrator'],
        description: 'Automated attendance reminder settings',
      });
      settings = await this.mailSettingsRepository.save(settings);
      this.logger.log('Created default mail settings');
    }

    return settings;
  }

  /**
   * Update mail settings
   */
  async updateSettings(
    updateDto: UpdateMailSettingsDto,
    user: UserEntity,
  ): Promise<MailSettings> {
    const settings = await this.getSettings();

    // Update fields
    if (updateDto.enabled !== undefined) {
      settings.enabled = updateDto.enabled;
    }
    if (updateDto.clockInRemindersEnabled !== undefined) {
      settings.clockInRemindersEnabled = updateDto.clockInRemindersEnabled;
    }
    if (updateDto.clockOutRemindersEnabled !== undefined) {
      settings.clockOutRemindersEnabled = updateDto.clockOutRemindersEnabled;
    }
    if (updateDto.gracePeriodMinutes !== undefined) {
      settings.gracePeriodMinutes = updateDto.gracePeriodMinutes;
    }
    if (updateDto.cronSchedule !== undefined) {
      settings.cronSchedule = updateDto.cronSchedule;
      this.logger.log(`Cron schedule updated to: ${updateDto.cronSchedule}. Server restart required for changes to take effect.`);
    }
    if (updateDto.excludedRoles !== undefined) {
      settings.excludedRoles = updateDto.excludedRoles;
    }
    if (updateDto.description !== undefined) {
      settings.description = updateDto.description;
    }

    // Track who modified
    settings.lastModifiedBy = user.id;
    settings.lastModifiedAt = new Date();

    const updated = await this.mailSettingsRepository.save(settings);
    
    this.logger.log(`Mail settings updated by ${user.name} (${user.email})`);
    this.logger.log(`New settings: ${JSON.stringify({
      enabled: updated.enabled,
      clockInRemindersEnabled: updated.clockInRemindersEnabled,
      clockOutRemindersEnabled: updated.clockOutRemindersEnabled,
      gracePeriodMinutes: updated.gracePeriodMinutes,
    })}`);

    return updated;
  }

  /**
   * Check if attendance reminders are enabled globally
   */
  async areRemindersEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.enabled;
  }

  /**
   * Check if clock-in reminders are enabled
   */
  async areClockInRemindersEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.enabled && settings.clockInRemindersEnabled;
  }

  /**
   * Check if clock-out reminders are enabled
   */
  async areClockOutRemindersEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.enabled && settings.clockOutRemindersEnabled;
  }

  /**
   * Get grace period in minutes
   */
  async getGracePeriodMinutes(): Promise<number> {
    const settings = await this.getSettings();
    return settings.gracePeriodMinutes;
  }

  /**
   * Get excluded roles
   */
  async getExcludedRoles(): Promise<string[]> {
    const settings = await this.getSettings();
    return settings.excludedRoles || [];
  }

  /**
   * Get cron schedule
   */
  async getCronSchedule(): Promise<string> {
    const settings = await this.getSettings();
    return settings.cronSchedule || '*/15 * * * *';
  }
}
