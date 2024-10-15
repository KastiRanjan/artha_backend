import { WorkLog } from 'src/worklogs/entities/worklog.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique, OneToMany } from 'typeorm';

@Entity()
export class Project {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column('text')
    description: string;

    @Column({ length: 20 })
    status: 'active' | 'suspended' | 'archived' | 'signed_off' = 'active';

    @Column({ length: 30 })
    natureOfWork: 'external_audit' | 'tax_compliance' | 'accounts_review' | 'legal_services' | 'financial_projection' | 'valuation' | 'internal_audit' | 'others';

    @Column()
    fiscalYear: number;

    @Column({ type: 'date' })
    startingDate: Date;

    @Column({ type: 'date' })
    endingDate: Date;

    @OneToMany(() => WorkLog, worklog=> worklog.project, { onDelete: 'CASCADE' })
    worklog: WorkLog;

    // Optional: Add a method to get a string representation
    toString(): string {
        return this.name;
    }
}
