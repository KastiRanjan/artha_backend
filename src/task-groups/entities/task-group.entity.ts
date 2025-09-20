import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TaskSuper } from 'src/task-super/entities/task-super.entity';
import { TaskTemplate } from 'src/task-template/entities/task-template.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TaskGroup extends CustomBaseEntity {
  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ nullable: true, default: 0 })
  rank: number;

  @ManyToOne(() => TaskSuper, (taskSuper) => taskSuper.taskGroups, {
    onDelete: 'CASCADE',
    nullable: true
  })
  taskSuper?: TaskSuper;
  
  @Column({ nullable: true, type: 'uuid' })
  taskSuperId?: string;

  @OneToMany(() => TaskTemplate, (task) => task.group, {
    nullable: true
  })
  tasktemplate?: TaskTemplate[];
}
