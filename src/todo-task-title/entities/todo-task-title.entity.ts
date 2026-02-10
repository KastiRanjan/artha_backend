import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TaskType } from 'src/task-type/entities/task-type.entity';
import { Entity, Column, OneToMany } from 'typeorm';

@Entity()
export class TodoTaskTitle extends CustomBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => TaskType, (taskType) => taskType.todoTaskTitle)
  taskTypes: TaskType[];
}
