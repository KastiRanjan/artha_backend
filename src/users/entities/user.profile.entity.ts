import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

/**
 * User profile Entity
 */
@Entity({
  name: 'user_profile'
})
export class UserProfileEntity extends CustomBaseEntity {
  @Column({ type: 'enum', enum: ['operations', 'accounts', 'administration'] })
  department: string;

  @Column({ length: 100 })
  location: string;

  @Column({ type: 'enum', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], nullable: true })
  bloodGroup: string;

  @Column({ type: 'enum', enum: ['single', 'married', 'divorced', 'widowed'], nullable: true })
  maritalStatus: string;

  @Column({ type: 'enum', enum: ['male', 'female'], nullable: true })
  gender: string;

  @Column({ type: 'enum', enum: ['single_assessee', 'couple_assessees'], nullable: true })
  taxCalculation: string;

  @Column({ unique: true, length: 15 })
  panNo: string;

  // Address fields
  @Column({ length: 100 })
  permanentAddressCountry: string;

  @Column({ length: 100 })
  permanentAddressState: string;

  @Column({ length: 100 })
  permanentAddressDistrict: string;

  @Column({ length: 100 })
  permanentAddressLocalJurisdiction: string;

  @Column({ length: 10 })
  permanentAddressWardNo: string;

  @Column({ length: 100 })
  permanentAddressLocality: string;

  @Column({ length: 100 })
  temporaryAddressCountry: string;

  @Column({ length: 100 })
  temporaryAddressState: string;

  @Column({ length: 100 })
  temporaryAddressDistrict: string;

  @Column({ length: 100 })
  temporaryAddressLocalJurisdiction: string;

  @Column({ length: 10 })
  temporaryAddressWardNo: string;

  @Column({ length: 100 })
  temporaryAddressLocality: string;

  @Column({ length: 100 })
  guardianName: string;

  @Column({ length: 50 })
  guardianRelation: string;

  @Column({ length: 15 })
  guardianContact: string;

  // Personal contact fields
  @Column({ length: 15 })
  contactNo: string;

  @Column({ length: 15, nullable: true })
  alternateContactNo: string;

  @Column({ length: 254 })
  personalEmail: string;

  // Leave fields
  @Column({ default: 0 })
  casualLeaves: number;

  @Column({ default: 0 })
  examLeaves: number;

  @Column({ default: 0 })
  maternityLeaves: number;

  @Column({ default: 0 })
  paternityLeaves: number;

  @Column({ default: 0 })
  otherLeaves: number;

  // Benefit section
  @Column({ default: false })
  pf: boolean;

  // Salary & allowance section
  @Column({ type: 'float', default: 0.0 })
  hourlyCostRate: number;

  @Column({ type: 'float', default: 0.0 })
  publicHolidayAllowance: number;

  @ManyToOne(() => UserEntity, (user) => user.profile)
  user: UserEntity;
}
