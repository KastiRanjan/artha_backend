import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
export class Attendance extends CustomBaseEntity {


  @Index() // Adds an index for performance on queries
  @Column()
  userId: string;

  @Column({ nullable: true })
  date: string;

  @Column({ nullable: true })
  clockIn: string;

  @Column({ nullable: true })
  clockOut: string;

  @Column({ nullable: true })
  latitude?: string;

  @Column({ nullable: true })
  longitude?: string;
}