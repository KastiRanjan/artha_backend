import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Customer } from './customer.entity';

@Entity()
export class RegistrationAndLicense extends CustomBaseEntity {

    @ManyToOne(() => Customer, customer => customer.registrationAndLicenses)
    customer: Customer;

    @Column({ length: 100, nullable: true })
    statutoryAuthority?: string;

    @Column({ length: 100, nullable: true })
    registrationLicenseNo?: string;

    @Column({ type: 'date', nullable: true })
    dateOfIssue?: Date;

    @Column({ type: 'date', nullable: true })
    validDate?: Date;

    @Column({ type: 'enum', enum: ['every_year', 'every_3_years', 'every_5_years', 'more_than_5_years', 'renewal_not_required'], nullable: true })
    frequencyOfRenewal?: string;

    @Column({ type: 'text', nullable: true })
    registrationLicenseAttachment?: string;

    toString() {
        return `${this.registrationLicenseNo} - ${this.statutoryAuthority} (${this.customer.name})`;
    }
}
