import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    message: string;

    @Column({ nullable: true })
    link: string;

    @Column({ nullable: true })
    type: string; // e.g., 'info', 'warning', 'error'

    @CreateDateColumn()
    createdAt: Date;
}
