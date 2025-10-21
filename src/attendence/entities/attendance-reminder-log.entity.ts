import { Column, Entity, Index } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';

@Entity({
  name: 'attendance_reminder_logs'
})
@Index(['userId', 'date', 'reminderType'], { unique: true })
export class AttendanceReminderLog extends CustomBaseEntity {
  @Column()
  userId: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD format

  @Column({
    type: 'enum',
    enum: ['clock-in', 'clock-out'],
  })
  reminderType: 'clock-in' | 'clock-out';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ nullable: true })
  userName: string;
}
