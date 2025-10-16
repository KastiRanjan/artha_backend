import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    message: string;

    @Column({ nullable: true })
    link: string;

    @Column({ 
        type: 'enum', 
        enum: NotificationType, 
        default: NotificationType.GENERAL 
    })
    type: NotificationType;

    @CreateDateColumn()
    createdAt: Date;
}
