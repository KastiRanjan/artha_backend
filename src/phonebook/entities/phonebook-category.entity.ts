import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity } from 'typeorm';

@Entity('phonebook_categories')
export class PhonebookCategory extends CustomBaseEntity {
  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;
}
