import { Holiday } from '../entities/holiday.entity';

export class HolidaySerializer {
  static serialize(holiday: Holiday) {
    return {
      id: holiday.id,
      date: holiday.date,
      bsDate: holiday.bsDate,
      type: holiday.type,
      title: holiday.title,
      description: holiday.description,
    };
  }

  static serializeMany(holidays: Holiday[]) {
    return holidays.map(this.serialize);
  }
}
