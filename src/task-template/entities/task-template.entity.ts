import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';
import { Task } from 'src/tasks/entities/task.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique
} from 'typeorm';

@Entity()
export class TaskTemplate extends CustomBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ nullable: true, default: 0 })
  rank: number;

  @Column({ nullable: true, type: 'float', default: 0 })
  budgetedHours: number;

  @ManyToOne(() => TaskGroup, (taskGroup) => taskGroup.tasktemplate, {
    onDelete: 'CASCADE',
    nullable: true
  })
  group?: TaskGroup;

  @ManyToOne(() => TaskTemplate, (task) => task.subTasks, {
    onDelete: 'SET NULL',
    nullable: true
  })
  @JoinColumn({ name: 'parentTaskId' })
  parentTask?: TaskTemplate;

  @OneToMany(() => TaskTemplate, (task) => task.parentTask)
  subTasks?: TaskTemplate[];

  @Column({
    type: 'enum',
    enum: ['story', 'task'],
    default: 'task',
    nullable: true
  })
  taskType?: 'story' | 'task';
}
