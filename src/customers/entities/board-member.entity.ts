import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Customer } from './customer.entity';

@Entity()
export class BoardMember {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Customer, customer => customer.boardMembers)
    customer: Customer;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 100 })
    designation: string;

    @Column({ length: 15, nullable: true })
    mobileNo?: string;

    @Column({ length: 15, nullable: true })
    telephoneNo?: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ length: 10, nullable: true })
    extNo?: string;

    toString() {
        return `${this.name} - ${this.designation} (${this.customer.name})`;
    }
}
