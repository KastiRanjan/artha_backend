import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Customer } from './customer.entity';

@Entity()
export class OtherImportantInfo extends CustomBaseEntity {

    @ManyToOne(() => Customer, customer => customer.otherImportantInfos)
    customer: Customer;

    @Column({ length: 200 })
    particular: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'text', nullable: true })
    attachment?: string;

    toString() {
        return `${this.particular} for ${this.customer.name}`;
    }
}
