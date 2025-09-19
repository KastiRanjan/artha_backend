import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Project } from 'src/projects/entities/project.entity';
import { TaskSuperProject } from 'src/task-super/entities/task-super-project.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('task_group_project')
export class TaskGroupProject extends CustomBaseEntity {
  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ nullable: true, default: 0 })
  rank: number;

  @ManyToOne(() => TaskSuperProject, (taskSuper) => taskSuper.taskGroups, {
    onDelete: 'CASCADE',
    nullable: true
  })
  taskSuper?: TaskSuperProject;
  
  @Column({ nullable: true, type: 'uuid' })
  taskSuperId?: string;

  @OneToMany(() => Task, (task) => task.groupProject, {
    nullable: true
  })
  tasks?: Task[];

  @ManyToOne(() => Project, { nullable: false })
  project: Project;

  @Column({ nullable: false, type: 'uuid' })
  projectId: string;

  @Column({ nullable: true, type: 'uuid' })
  originalTaskGroupId: string;
}