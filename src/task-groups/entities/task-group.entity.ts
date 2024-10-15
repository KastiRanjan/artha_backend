import { Task } from 'src/tasks/entities/task.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  BeforeInsert
} from 'typeorm';

@Entity()
export class TaskGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @ManyToOne(() => Task, (task) => task.group, {
    onDelete: 'CASCADE',
    nullable: true
  })
  tasks?: Task;
}
