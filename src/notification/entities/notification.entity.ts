import { UserEntity } from 'src/auth/entity/user.entity';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, CreateDateColumn, Entity, ManyToMany, UpdateDateColumn } from 'typeorm';

@Entity()
export class Notification extends CustomBaseEntity {
    @ManyToMany(() => UserEntity, user => user.notifications)
    users: UserEntity[];

    @Column()
    message: string;

    @Column({ nullable: true })
    type: string; // e.g., 'info', 'warning', 'error'

    @Column({ nullable: true })
    link: string;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
