import { Calendar } from '../entities/calendar.entity';

export class CalendarSerializer {
  static serialize(calendar: Calendar) {
    return {
      id: calendar.id,
      date: calendar.date,
      bsDate: calendar.bsDate,
      dayOfWeek: calendar.dayOfWeek,
      isHoliday: calendar.isHoliday,
      holidayTitle: calendar.holidayTitle,
      holidayType: calendar.holidayType,
    };
  }

  static serializeMany(calendars: Calendar[]) {
    return calendars.map(this.serialize);
  }
}
