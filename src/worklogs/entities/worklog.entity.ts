import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { Task } from 'src/tasks/entities/task.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Unique
} from 'typeorm';

@Entity()
@Unique(['user', 'task', 'timestamp']) // Unique constraint
export class WorkLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.worklog)
  user: UserEntity;

  @ManyToOne(() => Project, (project) => project.worklog)
  project: Project;

  @ManyToOne(() => Task, (task) => task.worklog)
  task: Task;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @CreateDateColumn()
  timestamp: Date;

  // Optional: Add a method to get a string representation
  toString(): string {
    return `${this.user} worked on ${this.task} in ${this.project} from ${this.startTime} to ${this.endTime}`;
  }
}
