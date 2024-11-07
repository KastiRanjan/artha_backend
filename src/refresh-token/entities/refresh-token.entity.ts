import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity({
  name: 'refresh_token'
})
export class RefreshToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  ip: string;

  @Column()
  userAgent: string;

  @Index()
  @Column({
    nullable: true
  })
  browser: string;

  @Index()
  @Column({
    nullable: true
  })
  os: string;

  @Column()
  isRevoked: boolean;

  @Column()
  expires: Date;
}
