import { TaskTemplate } from 'src/task-template/entities/task-template.entity';
import { Task } from 'src/tasks/entities/task.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity()
export class TaskGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @OneToMany(() => TaskTemplate, (task) => task.group, {
    onDelete: 'CASCADE',
    nullable: true
  })
  tasktemplate?: TaskTemplate[];
}
