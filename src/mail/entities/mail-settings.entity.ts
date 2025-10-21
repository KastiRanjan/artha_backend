import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Entity, Column } from 'typeorm';

@Entity('mail_settings')
export class MailSettings extends CustomBaseEntity {
  @Column({ default: 'attendance_reminders' })
  settingKey: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true })
  description: string;

  // Specific settings for attendance reminders
  @Column({ default: true })
  clockInRemindersEnabled: boolean;

  @Column({ default: true })
  clockOutRemindersEnabled: boolean;

  @Column({ default: 60 })
  gracePeriodMinutes: number;

  @Column({ default: '*/15 * * * *' })
  cronSchedule: string; // Cron expression for scheduler (default: every 15 minutes)

  @Column({ type: 'simple-array', nullable: true })
  excludedRoles: string[]; // Roles that won't receive reminders

  @Column({ nullable: true })
  lastModifiedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  lastModifiedAt: Date;
}
