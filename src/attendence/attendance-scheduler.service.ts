import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronJob } from 'cron';
import * as moment from 'moment';

import { UserEntity } from 'src/auth/entity/user.entity';
import { Attendance } from './entities/attendence.entity';
import { AttendanceReminderLog } from './entities/attendance-reminder-log.entity';
import { LeaveService } from 'src/leave/leave.service';
import { HolidayService } from 'src/holiday/holiday.service';
import { WorkhourService } from 'src/workhour/workhour.service';
import { MailService } from 'src/mail/mail.service';
import { MailSettingsService } from 'src/mail/mail-settings.service';

@Injectable()
export class AttendanceSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(AttendanceSchedulerService.name);

  // Configuration
  private readonly CLOCK_IN_REMINDER_SLUG = 'clock-in-reminder';
  private readonly CLOCK_OUT_REMINDER_SLUG = 'clock-out-reminder';

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(AttendanceReminderLog)
    private readonly reminderLogRepository: Repository<AttendanceReminderLog>,
    private readonly leaveService: LeaveService,
    private readonly holidayService: HolidayService,
    private readonly workhourService: WorkhourService,
    private readonly mailService: MailService,
    private readonly mailSettingsService: MailSettingsService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  /**
   * Initialize dynamic cron jobs from database settings
   */
  async onModuleInit() {
    try {
      const cronSchedule = await this.mailSettingsService.getCronSchedule();
      this.logger.log(`⚙️  Initializing dynamic cron jobs with schedule: ${cronSchedule}`);
      
      // Add dynamic cron jobs
      this.addDynamicCronJob('dynamic-clock-in-check', cronSchedule, () => this.checkClockInReminders());
      this.addDynamicCronJob('dynamic-clock-out-check', cronSchedule, () => this.checkClockOutReminders());
      
      this.logger.log(`✅ Dynamic cron jobs registered successfully`);
    } catch (error) {
      this.logger.error(`❌ Failed to initialize dynamic cron jobs: ${error.message}`);
      this.logger.warn(`⚠️  Falling back to default schedule: */15 * * * *`);
    }
  }

  /**
   * Add a dynamic cron job
   */
  private addDynamicCronJob(name: string, cronExpression: string, callback: () => void) {
    try {
      // Remove existing job if it exists
      try {
        const existingJob = this.schedulerRegistry.getCronJob(name);
        if (existingJob) {
          existingJob.stop();
          this.schedulerRegistry.deleteCronJob(name);
        }
      } catch (e) {
        // Job doesn't exist, that's fine
      }

      // Create new cron job
      const job = new CronJob(cronExpression, callback, null, true, 'Asia/Kathmandu');
      this.schedulerRegistry.addCronJob(name, job);
      job.start();
      
      this.logger.debug(`✅ Cron job '${name}' added with schedule: ${cronExpression}`);
    } catch (error) {
      this.logger.error(`❌ Failed to add cron job '${name}': ${error.message}`);
      throw error;
    }
  }

  /**
   * Check for clock-in reminders
   * Called by dynamic cron job registered in onModuleInit
   * Schedule is configured in mail settings
   */
  async checkClockInReminders() {
    this.logger.log('Running clock-in reminder check...');
    
    try {
      // Check if clock-in reminders are enabled in settings
      const enabled = await this.mailSettingsService.areClockInRemindersEnabled();
      if (!enabled) {
        this.logger.log('Clock-in reminders are disabled in mail settings. Skipping.');
        return;
      }

      const today = moment().format('YYYY-MM-DD');
      const currentTime = moment();

      // Check if today is a holiday
      const isHoliday = await this.isHolidayToday(today);
      if (isHoliday) {
        this.logger.log('Today is a holiday. Skipping clock-in reminders.');
        return;
      }

      // Get all active users
      const allUsers = await this.userRepository.find({
        where: { status: 'active' },
        relations: ['role'],
      });

      this.logger.log(`Checking ${allUsers.length} users for clock-in reminders...`);

      for (const user of allUsers) {
        try {
          this.logger.log(`🔍 Checking user: ${user.name} (${user.email})`);
          
          // Skip excluded users (based on settings)
          const isExcluded = await this.isUserExcluded(user);
          if (isExcluded) {
            this.logger.log(`⏭️  User ${user.name} is excluded from reminders. Skipping.`);
            continue;
          }

          // Check if reminder already sent today (from database)
          const alreadySent = await this.hasReminderBeenSent(user.id, today, 'clock-in');
          if (alreadySent) {
            this.logger.log(`⏭️  Clock-in reminder already sent to ${user.name} today. Skipping.`);
            continue;
          }

          // Skip if user is on leave
          const isOnLeave = await this.isUserOnLeave(user.id, today);
          if (isOnLeave) {
            this.logger.log(`⏭️  User ${user.name} is on leave. Skipping.`);
            continue;
          }

          // Get user's workhour settings
          const workhour = await this.workhourService.resolveForUser(user.id, user.roleId);
          const expectedStartTime = moment(workhour.startTime, 'HH:mm');
          
          // Get grace period from settings
          const gracePeriodMinutes = await this.mailSettingsService.getGracePeriodMinutes();
          const reminderTime = expectedStartTime.clone().add(gracePeriodMinutes, 'minutes');

          this.logger.log(`⏰ User ${user.name}: Expected=${expectedStartTime.format('HH:mm')}, Grace=${gracePeriodMinutes}min, ReminderTime=${reminderTime.format('HH:mm')}, Current=${currentTime.format('HH:mm')}`);

          // Check if it's time to send reminder (after grace period has passed)
          const timeDiff = currentTime.diff(reminderTime, 'minutes');
          this.logger.log(`⏱️  Time difference: ${timeDiff} minutes (should be >= 0)`);
          
          if (timeDiff < 0) {
            // Not yet past grace period
            this.logger.log(`⏭️  Too early for ${user.name}. Still ${Math.abs(timeDiff)} minutes until reminder time.`);
            continue;
          }

          // Check if user has already clocked in
          const attendance = await this.attendanceRepository.findOne({
            where: { userId: user.id, date: today },
          });

          if (attendance && attendance.clockIn) {
            this.logger.log(`⏭️  User ${user.name} has already clocked in at ${attendance.clockIn}. Skipping.`);
            continue;
          }

          this.logger.log(`📧 Sending clock-in reminder to ${user.name} (${user.email})`);
          
          // Send reminder email (only once per day)
          await this.sendClockInReminder(user, workhour.startTime);
          
          // Mark as sent in database (prevents duplicates even after server restart)
          await this.logReminderSent(user.id, today, 'clock-in', user.email, user.name);
          
          this.logger.log(`✅ Clock-in reminder sent successfully to ${user.name}`);
        } catch (error) {
          this.logger.error(`❌ Error processing user ${user.name}: ${error.message}`);
        }
      }

      this.logger.log('Clock-in reminder check completed.');
    } catch (error) {
      this.logger.error(`Error in checkClockInReminders: ${error.message}`, error.stack);
    }
  }

  /**
   * Check for clock-out reminders
   * Called by dynamic cron job registered in onModuleInit
   * Schedule is configured in mail settings
   */
  async checkClockOutReminders() {
    this.logger.log('Running clock-out reminder check...');
    
    try {
      // Check if clock-out reminders are enabled in settings
      const enabled = await this.mailSettingsService.areClockOutRemindersEnabled();
      if (!enabled) {
        this.logger.log('Clock-out reminders are disabled in mail settings. Skipping.');
        return;
      }

      const today = moment().format('YYYY-MM-DD');
      const currentTime = moment();

      // Check if today is a holiday
      const isHoliday = await this.isHolidayToday(today);
      if (isHoliday) {
        this.logger.log('Today is a holiday. Skipping clock-out reminders.');
        return;
      }

      // Get all active users
      const allUsers = await this.userRepository.find({
        where: { status: 'active' },
        relations: ['role'],
      });

      this.logger.log(`Checking ${allUsers.length} users for clock-out reminders...`);

      for (const user of allUsers) {
        try {
          this.logger.log(`🔍 Checking user: ${user.name} (${user.email})`);
          
          // Skip excluded users (based on settings)
          const isExcluded = await this.isUserExcluded(user);
          if (isExcluded) {
            this.logger.log(`⏭️  User ${user.name} is excluded from reminders. Skipping.`);
            continue;
          }

          // Check if reminder already sent today (from database)
          const alreadySent = await this.hasReminderBeenSent(user.id, today, 'clock-out');
          if (alreadySent) {
            this.logger.log(`⏭️  Clock-out reminder already sent to ${user.name} today. Skipping.`);
            continue;
          }

          // Skip if user is on leave
          const isOnLeave = await this.isUserOnLeave(user.id, today);
          if (isOnLeave) {
            this.logger.log(`⏭️  User ${user.name} is on leave. Skipping.`);
            continue;
          }

          // Check if user has clocked in
          const attendance = await this.attendanceRepository.findOne({
            where: { userId: user.id, date: today },
          });

          if (!attendance || !attendance.clockIn) {
            this.logger.log(`⏭️  User ${user.name} hasn't clocked in. Skipping clock-out reminder.`);
            continue;
          }

          if (attendance.clockOut) {
            this.logger.log(`⏭️  User ${user.name} has already clocked out at ${attendance.clockOut}. Skipping.`);
            continue;
          }

          // Get user's workhour settings
          const workhour = await this.workhourService.resolveForUser(user.id, user.roleId);
          const expectedEndTime = moment(workhour.endTime, 'HH:mm');
          
          // Get grace period from settings
          const gracePeriodMinutes = await this.mailSettingsService.getGracePeriodMinutes();
          const reminderTime = expectedEndTime.clone().add(gracePeriodMinutes, 'minutes');

          this.logger.log(`⏰ User ${user.name}: Expected=${expectedEndTime.format('HH:mm')}, Grace=${gracePeriodMinutes}min, ReminderTime=${reminderTime.format('HH:mm')}, Current=${currentTime.format('HH:mm')}`);

          // Check if it's time to send reminder (after grace period has passed)
          const timeDiff = currentTime.diff(reminderTime, 'minutes');
          this.logger.log(`⏱️  Time difference: ${timeDiff} minutes (should be >= 0)`);
          
          if (timeDiff < 0) {
            // Not yet past grace period
            this.logger.log(`⏭️  Too early for ${user.name}. Still ${Math.abs(timeDiff)} minutes until reminder time.`);
            continue;
          }

          this.logger.log(`📧 Sending clock-out reminder to ${user.name} (${user.email})`);
          
          // Send reminder email (only once per day)
          await this.sendClockOutReminder(user, workhour.endTime, attendance.clockIn);
          
          // Mark as sent in database (prevents duplicates even after server restart)
          await this.logReminderSent(user.id, today, 'clock-out', user.email, user.name);
          
          this.logger.log(`✅ Clock-out reminder sent successfully to ${user.name}`);
        } catch (error) {
          this.logger.error(`❌ Error processing user ${user.name}: ${error.message}`);
        }
      }

      this.logger.log('Clock-out reminder check completed.');
    } catch (error) {
      this.logger.error(`Error in checkClockOutReminders: ${error.message}`, error.stack);
    }
  }

  /**
   * Helper: Check if reminder has been sent today (database check)
   */
  private async hasReminderBeenSent(
    userId: string,
    date: string,
    reminderType: 'clock-in' | 'clock-out'
  ): Promise<boolean> {
    try {
      const log = await this.reminderLogRepository.findOne({
        where: { userId, date, reminderType },
      });
      return !!log;
    } catch (error) {
      this.logger.error(`Error checking reminder log: ${error.message}`);
      return false; // On error, allow sending (better to send than skip)
    }
  }

  /**
   * Helper: Log that a reminder was sent (persist to database)
   */
  private async logReminderSent(
    userId: string,
    date: string,
    reminderType: 'clock-in' | 'clock-out',
    userEmail: string,
    userName: string
  ): Promise<void> {
    try {
      const log = this.reminderLogRepository.create({
        userId,
        date,
        reminderType,
        userEmail,
        userName,
      });
      await this.reminderLogRepository.save(log);
      this.logger.debug(`✅ Logged ${reminderType} reminder for ${userName} on ${date}`);
    } catch (error) {
      // If duplicate (unique constraint violation), that's fine - reminder was already logged
      if (error.code === '23505') {
        this.logger.debug(`Reminder already logged for ${userName} on ${date}`);
      } else {
        this.logger.error(`Error logging reminder: ${error.message}`);
      }
    }
  }

  /**
   * Helper: Check if user is excluded from reminders (based on settings)
   */
  private async isUserExcluded(user: UserEntity): Promise<boolean> {
    if (!user.role) {
      return false;
    }

    const excludedRoles = await this.mailSettingsService.getExcludedRoles();
    const roleName = user.role.name?.toLowerCase() || '';
    
    return excludedRoles.some(role => role.toLowerCase() === roleName);
  }

  /**
   * Helper: Check if today is a holiday
   */
  private async isHolidayToday(date: string): Promise<boolean> {
    try {
      const holidays = await this.holidayService.findAll();
      return holidays.some(holiday => holiday.date === date);
    } catch (error) {
      this.logger.error(`Error checking holiday: ${error.message}`);
      return false;
    }
  }

  /**
   * Helper: Check if user is on approved leave
   */
  private async isUserOnLeave(userId: string, date: string): Promise<boolean> {
    try {
      const leaves = await this.leaveService.findAll('approved');
      return leaves.some(
        leave => 
          leave.user.id === userId && 
          date >= leave.startDate && 
          date <= leave.endDate
      );
    } catch (error) {
      this.logger.error(`Error checking leave for user ${userId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send clock-in reminder email
   */
  private async sendClockInReminder(user: UserEntity, expectedTime: string) {
    try {
      this.logger.log(`Sending clock-in reminder to ${user.name} (${user.email})`);

      const gracePeriodMinutes = await this.mailSettingsService.getGracePeriodMinutes();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      const success = await this.mailService.sendMail(
        {
          to: user.email,
          subject: 'Reminder: Please Clock In',
          slug: this.CLOCK_IN_REMINDER_SLUG,
          context: {
            userName: user.name,
            expectedTime: expectedTime,
            currentDate: moment().format('MMMM DD, YYYY'),
            gracePeriod: `${gracePeriodMinutes}`,
            frontendUrl: frontendUrl,
            clockInUrl: `${frontendUrl}/attendance`,
            companyName: process.env.COMPANY_NAME || 'Artha',
            currentYear: moment().format('YYYY'),
          },
        },
        'clock-in-reminder'
      );

      if (success) {
        this.logger.log(`✅ Clock-in reminder sent successfully to ${user.email}`);
      } else {
        this.logger.warn(`⚠️ Failed to send clock-in reminder to ${user.email}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error sending clock-in reminder to ${user.email}: ${error.message}`);
    }
  }

  /**
   * Send clock-out reminder email
   */
  private async sendClockOutReminder(user: UserEntity, expectedTime: string, clockInTime: string) {
    try {
      this.logger.log(`Sending clock-out reminder to ${user.name} (${user.email})`);

      const gracePeriodMinutes = await this.mailSettingsService.getGracePeriodMinutes();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      const success = await this.mailService.sendMail(
        {
          to: user.email,
          subject: 'Reminder: Please Clock Out',
          slug: this.CLOCK_OUT_REMINDER_SLUG,
          context: {
            userName: user.name,
            expectedTime: expectedTime,
            clockInTime: clockInTime,
            currentDate: moment().format('MMMM DD, YYYY'),
            gracePeriod: `${gracePeriodMinutes}`,
            frontendUrl: frontendUrl,
            clockOutUrl: `${frontendUrl}/attendance`,
            companyName: process.env.COMPANY_NAME || 'Artha',
            currentYear: moment().format('YYYY'),
          },
        },
        'clock-out-reminder'
      );

      if (success) {
        this.logger.log(`✅ Clock-out reminder sent successfully to ${user.email}`);
      } else {
        this.logger.warn(`⚠️ Failed to send clock-out reminder to ${user.email}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error sending clock-out reminder to ${user.email}: ${error.message}`);
    }
  }

  /**
   * Manual trigger for testing (can be called via API endpoint)
   */
  async triggerClockInReminders() {
    this.logger.log('Manually triggering clock-in reminders...');
    await this.checkClockInReminders();
  }

  /**
   * Manual trigger for testing (can be called via API endpoint)
   */
  async triggerClockOutReminders() {
    this.logger.log('Manually triggering clock-out reminders...');
    await this.checkClockOutReminders();
  }
}
