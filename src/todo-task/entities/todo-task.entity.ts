import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TaskType } from 'src/task-type/entities/task-type.entity';
import { TodoTaskTitle } from 'src/todo-task-title/entities/todo-task-title.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';

export enum TodoTaskStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  PENDING = 'pending',
  COMPLETED = 'completed',
  DROPPED = 'dropped'
}

@Entity()
export class TodoTask extends CustomBaseEntity {
  @Column({ nullable: true })
  titleId: string;

  @ManyToOne(() => TodoTaskTitle, { nullable: true })
  @JoinColumn({ name: 'titleId' })
  todoTaskTitle: TodoTaskTitle;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column()
  taskTypeId: string;

  @ManyToOne(() => TaskType, taskType => taskType.todoTasks)
  @JoinColumn({ name: 'taskTypeId' })
  taskType: TaskType;

  @Column()
  createdById: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdById' })
  createdByUser: UserEntity;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdTimestamp: Date;

  @Column({ nullable: true, type: 'timestamp' })
  dueDate: Date;

  @Column()
  assignedToId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: UserEntity;

  @Column({ nullable: true, type: 'timestamp' })
  acknowledgedTimestamp: Date;

  @Column({ nullable: true, type: 'text' })
  acknowledgeRemark: string;

  @Column({ nullable: true })
  completedById: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'completedById' })
  completedBy: UserEntity;

  @Column({ nullable: true, type: 'text' })
  completionRemark: string;

  @Column({ nullable: true, type: 'timestamp' })
  completedTimestamp: Date;

  @Column({ nullable: true, type: 'text' })
  pendingRemark: string;

  @Column({ nullable: true, type: 'timestamp' })
  pendingTimestamp: Date;

  @Column({ nullable: true, type: 'text' })
  droppedRemark: string;

  @Column({ nullable: true, type: 'timestamp' })
  droppedTimestamp: Date;

  @ManyToMany(() => UserEntity, { eager: false })
  @JoinTable({ name: 'todo_task_inform_to' })
  informTo: UserEntity[];

  @Column({
    type: 'enum',
    enum: TodoTaskStatus,
    default: TodoTaskStatus.OPEN
  })
  status: TodoTaskStatus;
}