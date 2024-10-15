import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, BeforeInsert, OneToMany } from 'typeorm';
import { WorkLog } from 'src/worklogs/entities/worklog.entity';
import { TaskGroup } from './task.group.entity';

@Entity()
export class Task {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column('text', { nullable: true })
    description?: string;

    @OneToMany(() => WorkLog, worklog=> worklog.task, { onDelete: 'CASCADE' })
    worklog: WorkLog;

    @OneToMany(() => TaskGroup, taskGroup => taskGroup.tasks, { onDelete: 'CASCADE', nullable: true })
    group?: TaskGroup;
}
