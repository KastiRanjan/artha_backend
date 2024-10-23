import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Index() // Adds an index for performance on queries
  @Column()
  userId: number;

  @Column({ type: 'enum', enum: ['check-in', 'check-out'] }) // Example ENUM for action
  action: 'check-in' | 'check-out';

  @Column()
  timestamp: Date;

  @Column({ nullable: true }) // If latitude/longitude might not always be present
  latitude?: number;

  @Column({ nullable: true })
  longitude?: number;
}