import { Factory } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { LeaveType } from '../../leave-type/entities/leave-type.entity';

export default class CreateLeaveTypeSeed {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const defaultLeaveTypes = [
      {
        name: 'Annual Leave',
        description: 'Yearly vacation leave',
        maxDaysPerYear: 21,
        isActive: true,
      },
      {
        name: 'Sick Leave',
        description: 'Medical leave for illness',
        maxDaysPerYear: 12,
        isActive: true,
      },
      {
        name: 'Emergency Leave',
        description: 'Urgent personal matters',
        maxDaysPerYear: 5,
        isActive: true,
      },
      {
        name: 'Maternity Leave',
        description: 'Maternity leave for new mothers',
        maxDaysPerYear: 98,
        isActive: true,
      },
      {
        name: 'Paternity Leave',
        description: 'Paternity leave for new fathers',
        maxDaysPerYear: 15,
        isActive: true,
      },
      {
        name: 'Unpaid Leave',
        description: 'Leave without pay',
        maxDaysPerYear: null, // Unlimited
        isActive: true,
      },
    ];

    await connection
      .createQueryBuilder()
      .insert()
      .into(LeaveType)
      .values(defaultLeaveTypes)
      .orIgnore()
      .execute();
  }
}
