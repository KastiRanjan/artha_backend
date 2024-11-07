import { UserEntity } from 'src/auth/entity/user.entity';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Project } from 'src/projects/entities/project.entity';
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
@Unique(['name'])
export class Task extends CustomBaseEntity {
  @Column({})
  name: string;

  @Column({ nullable: true })
  tcode: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({
    type: 'enum',
    enum: ['open', 'in_progress', 'done'],
    default: 'open',
    nullable: true
  })
  status?: 'open' | 'in_progress' | 'done';

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

  @ManyToOne(() => TaskGroup, (taskGroup) => taskGroup.task, {
    onDelete: 'CASCADE',
    nullable: true
  })
  group?: TaskGroup;
}
