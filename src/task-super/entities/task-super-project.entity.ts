import { CustomBaseEntity } from '../../common/entity/custom-base.entity';
import { Project } from '../../projects/entities/project.entity';
import { TaskGroupProject } from '../../task-groups/entities/task-group-project.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity('task_super_project')
export class TaskSuperProject extends CustomBaseEntity {
  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ nullable: true, default: 0 })
  rank: number;

  @OneToMany(() => TaskGroupProject, (taskGroup) => taskGroup.taskSuper, {
    nullable: true
  })
  taskGroups?: TaskGroupProject[];

  @ManyToOne(() => Project, { nullable: false })
  project: Project;

  @Column({ nullable: false, type: 'uuid' })
  projectId: string;

  @Column({ nullable: true, type: 'uuid' })
  originalTaskSuperId: string;
}