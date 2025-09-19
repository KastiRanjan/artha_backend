import { UserEntity } from 'src/auth/entity/user.entity';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Project } from 'src/projects/entities/project.entity';
import { TaskGroupProject } from 'src/task-groups/entities/task-group-project.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';
import { Worklog } from 'src/worklog/entities/worklog.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Unique
} from 'typeorm';

@Entity()
export class Task extends CustomBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  tcode: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ nullable: true, default: 0 })
  rank: number;

  @Column({ nullable: true, type: 'float', default: 0 })
  budgetedHours: number;

  @Column({
    type: 'enum',
    enum: ['open', 'in_progress', 'done'],
    default: 'open',
    nullable: true
  })
  status?: 'open' | 'in_progress' | 'done';

  @Column({
    type: 'enum',
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'low',
    nullable: true
  })
  priority?: 'critical' | 'high' | 'medium' | 'low';

  @Column({
    type: 'enum',
    enum: ['story', 'task'],
    default: 'task',
    nullable: true
  })
  taskType?: 'story' | 'task';

  @Column({ nullable: true })
  first: boolean;

  @Column({ nullable: true })
  last: boolean;

  @Column({ nullable: true })
  completedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ nullable: true })
  firstVerifiedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  firstVerifiedAt?: Date;

  @Column({ nullable: true })
  secondVerifiedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  secondVerifiedAt?: Date;

  @ManyToOne(() => UserEntity, (user) => user.tasks)
  manager: UserEntity;

  @ManyToMany(() => UserEntity, (user) => user.assignedTasks)
  assignees: UserEntity[];

  @ManyToOne(() => Project, (project) => project.tasks)
  project: Project;

  @ManyToOne(() => Task, (task) => task.subTasks, {
    onDelete: 'SET NULL',
    nullable: true
  })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask?: Task;

  @OneToMany(() => Task, (task) => task.parentTask)
  subTasks?: Task[];

  @OneToMany(() => Worklog, (worklog) => worklog.task)
  worklogs: Worklog[];
  
  @ManyToOne(() => TaskGroupProject, (taskGroupProject) => taskGroupProject.tasks, {
    onDelete: 'CASCADE',
    nullable: true
  })
  groupProject?: TaskGroupProject;
}
