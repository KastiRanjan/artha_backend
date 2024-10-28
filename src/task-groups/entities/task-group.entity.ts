import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TaskTemplate } from 'src/task-template/entities/task-template.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TaskGroup extends CustomBaseEntity {
  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @OneToMany(() => TaskTemplate, (task) => task.group, {
    nullable: true
  })
  tasktemplate?: TaskTemplate[];

  @OneToMany(() => Task, (task) => task.group, {
    nullable: true
  })
  task?: Task[];
}
