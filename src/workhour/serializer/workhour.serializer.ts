import { Workhour } from '../entities/workhour.entity';

export class WorkhourSerializer {
  static serialize(workhour: Workhour) {
    return {
      id: workhour.id,
      roleId: workhour.roleId,
      workHours: workhour.workHours,
      startTime: workhour.startTime,
      endTime: workhour.endTime,
      validFrom: workhour.validFrom,
      isActive: workhour.isActive,
      createdAt: workhour.createdAt,
      updatedAt: workhour.updatedAt,
    };
  }

  static serializeMany(workhours: Workhour[]) {
    return workhours.map(this.serialize);
  }
}
