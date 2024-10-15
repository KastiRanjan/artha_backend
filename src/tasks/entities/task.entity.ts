import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique
} from 'typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';

@Entity()
@Unique(['name'])
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @ManyToMany(() => UserEntity, (user) => user.assignedTasks)
  assignees: UserEntity[];

  @ManyToOne(() => UserEntity, (user) => user.reporterTasks, {
    nullable: false
  })
  @JoinColumn({ name: 'reporterId' })
  reporter: UserEntity;

  @ManyToOne(() => TaskGroup, (taskGroup) => taskGroup.tasks, {
    onDelete: 'CASCADE',
    nullable: true
  })
  group?: TaskGroup;

  @ManyToOne(() => Project, (project) => project.tasks, {
    onDelete: 'CASCADE',
    nullable: true
  })
  @JoinColumn()
  project: Project;

  @ManyToOne(() => Task, (task) => task.subTasks, {
    onDelete: 'SET NULL',
    nullable: true
  })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask?: Task;

  @OneToMany(() => Task, (task) => task.parentTask)
  subTasks?: Task[];
}
