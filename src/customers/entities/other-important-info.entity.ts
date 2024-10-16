import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Customer } from './customer.entity';

@Entity()
export class OtherImportantInfo {
    @PrimaryGeneratedColumn()
    id: number;

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
