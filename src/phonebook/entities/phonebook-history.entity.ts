import { UserEntity } from 'src/auth/entity/user.entity';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { PhonebookEntry } from './phonebook-entry.entity';

export interface PhonebookFieldChange {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
}

@Entity('phonebook_histories')
export class PhonebookHistory extends CustomBaseEntity {
  @Column({ type: 'uuid' })
  entryId: string;

  @ManyToOne(() => PhonebookEntry, (entry) => entry.histories, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'entryId' })
  entry: PhonebookEntry;

  @Column({ length: 20, default: 'updated' })
  action: 'created' | 'updated';

  @Column({ type: 'uuid', nullable: true })
  editedById?: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'editedById' })
  editedBy?: UserEntity;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  changes: PhonebookFieldChange[];
}
