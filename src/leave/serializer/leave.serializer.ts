import { Leave } from '../entities/leave.entity';

export class LeaveSerializer {
  static serialize(leave: Leave) {
    return {
      id: leave.id,
      user: leave.user,
      startDate: leave.startDate,
      endDate: leave.endDate,
      type: leave.type,
      reason: leave.reason,
      status: leave.status,
      leadApproverId: leave.leadApproverId,
      pmApproverId: leave.pmApproverId,
      adminApproverId: leave.adminApproverId,
      createdAt: leave.createdAt,
      updatedAt: leave.updatedAt,
    };
  }

  static serializeMany(leaves: Leave[]) {
    return leaves.map(this.serialize);
  }
}
