import { UserEntity } from 'src/auth/entity/user.entity';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { RoleEntity } from 'src/role/entities/role.entity';
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, UpdateDateColumn } from 'typeorm';

@Entity()
export class NoticeBoard extends CustomBaseEntity {
    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column({ nullable: true })
    imagePath: string;

    @ManyToMany(() => UserEntity, user => user.notices)
    @JoinTable({
        name: 'notice_board_users',
        joinColumn: {
            name: 'noticeBoardId',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'userId',
            referencedColumnName: 'id'
        }
    })
    users: UserEntity[];

    @ManyToMany(() => RoleEntity)
    @JoinTable({
        name: 'notice_board_roles',
        joinColumn: {
            name: 'noticeBoardId',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'roleId',
            referencedColumnName: 'id'
        }
    })
    roles: RoleEntity[];

    @ManyToMany(() => UserEntity)
    @JoinTable({ name: 'notice_read_by_users' })
    readByUsers: UserEntity[];

    @Column({ default: false })
    sendToAll: boolean;

    @Column({ default: false })
    emailSent: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}