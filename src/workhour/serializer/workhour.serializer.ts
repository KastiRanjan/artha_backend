import { Workhour } from '../entities/workhour.entity';

export class WorkhourSerializer {
  static serialize(workhour: Workhour) {
    return {
      id: workhour.id,
      role: workhour.role,
      userId: workhour.userId,
      hours: workhour.hours,
      createdAt: workhour.createdAt,
      updatedAt: workhour.updatedAt,
    };
  }

  static serializeMany(workhours: Workhour[]) {
    return workhours.map(this.serialize);
  }
}
