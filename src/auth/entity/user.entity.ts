
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';

import { UserStatusEnum } from 'src/auth/user-status.enum';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { RoleEntity } from 'src/role/entities/role.entity';
import { UserProfileEntity } from 'src/users/entities/user.profile.entity';
import { UserContractEntity } from 'src/users/entities/user.contractdocument.entity';
import { UserBankDetailEntity } from 'src/users/entities/user.bankdetail.entity';
import { UserTrainningEntity } from 'src/users/entities/user.trainingcertificate.entity';
import { UserDocumentEntity } from 'src/users/entities/user.document.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { Project } from 'src/projects/entities/project.entity';
import { Worklog } from 'src/worklog/entities/worklog.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { UserEducationDetailEntity } from 'src/users/entities/user.educationdetail.entity';

/**
 * User Entity
 */
@Entity({
  name: 'user'
})
export class UserEntity extends CustomBaseEntity {
  @Index({
    unique: true
  })
  @Column()
  username: string;

  @Index({
    unique: true
  })
  @Column()
  email: string;

  @Column({ nullable: true })
  @Exclude({
    toPlainOnly: true
  })
  password: string;

  @Index()
  @Column()
  name: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  avatar: string;

  @Column()
  status: UserStatusEnum;

  @Column({ nullable: true })
  @Exclude({
    toPlainOnly: true
  })
  token: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  tokenValidityDate: Date;

  @Column()
  @Exclude({
    toPlainOnly: true
  })
  salt: string;

  @Column({
    nullable: true
  })
  @Exclude({
    toPlainOnly: true
  })
  twoFASecret?: string;

  @Exclude({
    toPlainOnly: true
  })
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  twoFAThrottleTime?: Date;

  @Column({
    default: false
  })
  isTwoFAEnabled: boolean;

  @Exclude({
    toPlainOnly: true
  })
  skipHashPassword = false;

  @ManyToOne(() => RoleEntity)
  @JoinColumn()
  role: RoleEntity;

  @Column()
  roleId: string;

  @OneToMany(() => Task, (task) => task.manager)
  tasks: Task[];

  @OneToOne(() => UserProfileEntity, (profile) => profile.user)
  profile: UserProfileEntity;

  @OneToMany(() => UserDocumentEntity, (document) => document.user)
  document: UserDocumentEntity[];

  @OneToMany(() => UserEducationDetailEntity, (document) => document.user)
  education_detail: UserEducationDetailEntity[];

  @OneToMany(() => UserContractEntity, (contract_detail) => contract_detail.user)
  contract_detail: UserContractEntity[];

  @OneToMany(
    () => UserTrainningEntity,
    (trainning_detail) => trainning_detail.user
  )
  trainning_detail: UserBankDetailEntity[];

  @OneToMany(() => UserBankDetailEntity, (bank_detail) => bank_detail.user)
  bank_detail: UserBankDetailEntity[];

  @ManyToMany(() => Notification, notification => notification.users)
  @JoinTable({
    name: 'user_notification',
    joinColumn: {
      name: 'notificationId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id'
    }
  })
  notifications: Notification[];

  @ManyToMany(() => Task, (task) => task.assignees)
  @JoinTable({
    name: 'task_user',
    joinColumn: {
      name: 'taskId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id'
    }
  })
  assignedTasks: Task[];

  @OneToOne(() => Project, (project) => project.projectLead, {
    nullable: true,
  })
  project: Project;

  @ManyToMany(() => Project, (project) => project.users)
  @JoinTable({
    name: 'user_project',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'projectId',
      referencedColumnName: 'id'
    }
  })
  projects: Project[];

  @OneToMany(() => Worklog, (worklog) => worklog.user)
  worklogs: Worklog[];

  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    if (this.password && !this.skipHashPassword) {
      await this.hashPassword();
    }
  }

  @BeforeUpdate()
  async hashPasswordBeforeUpdate() {
    if (this.password && !this.skipHashPassword) {
      await this.hashPassword();
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }

  async hashPassword() {
    this.password = await bcrypt.hash(this.password, this.salt);
  }
}
