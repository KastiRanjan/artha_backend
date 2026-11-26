import { Column, Entity } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';

@Entity({ name: 'training_categories' })
export class TrainingCategoryEntity extends CustomBaseEntity {
  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;
}
