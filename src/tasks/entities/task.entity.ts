import { UserEntity } from 'src/auth/entity/user.entity';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Project } from 'src/projects/entities/project.entity';
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

@Entity('tasks')
@Unique(['name'])
export class Task extends CustomBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

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
}
