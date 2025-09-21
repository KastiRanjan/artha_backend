import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TodoTask } from 'src/todo-task/entities/todo-task.entity';
import { Entity, Column, OneToMany } from 'typeorm';

@Entity()
export class TaskType extends CustomBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => TodoTask, todoTask => todoTask.taskType)
  todoTasks: TodoTask[];
}