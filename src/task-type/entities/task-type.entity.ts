import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TodoTask } from 'src/todo-task/entities/todo-task.entity';
import { TodoTaskTitle } from 'src/todo-task-title/entities/todo-task-title.entity';
import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class TaskType extends CustomBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  titleId: string;

  @ManyToOne(() => TodoTaskTitle, (title) => title.taskTypes, { nullable: true })
  @JoinColumn({ name: 'titleId' })
  todoTaskTitle: TodoTaskTitle;

  @OneToMany(() => TodoTask, todoTask => todoTask.taskType)
  todoTasks: TodoTask[];
}