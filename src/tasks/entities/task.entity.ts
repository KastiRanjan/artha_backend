import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Project } from 'src/projects/entities/project.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';
import { Worklog } from 'src/worklog/entities/worklog.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Unique
} from 'typeorm';

@Entity()
@Unique(['name'])
export class Task extends CustomBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @ManyToOne(() => TaskGroup, (taskGroup) => taskGroup.tasks, {
    onDelete: 'CASCADE',
    nullable: true
  })
  group?: TaskGroup;

  @ManyToMany(() => Project, (project) => project.tasks)
  @JoinTable({
    name: 'project_task',
    joinColumn: {
      name: 'projectId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'taskId',
      referencedColumnName: 'id'
    }
  })
  projects: Project;

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
