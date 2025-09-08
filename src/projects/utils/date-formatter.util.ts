import { CalendarUtil } from 'src/calendar/calendar.util';

export class ProjectDateFormatter {
  /**
   * Format date for display in Nepali format
   * @param date Date in YYYY-MM-DD format or Date object
   * @returns Formatted date string in Nepali format
   */
  static formatNepaliDate(date: string | Date): string {
    return CalendarUtil.formatNepaliDate(date);
  }

  /**
   * Add Nepali date information to project data
   * @param project Project entity or object with date fields
   * @returns Project with added Nepali date fields
   */
  static addNepaliDates(project: any): any {
    const result = { ...project };
    
    if (project.startingDate) {
      result.startingDateNepali = CalendarUtil.adToBs(
        typeof project.startingDate === 'string'
          ? project.startingDate
          : project.startingDate.toISOString().split('T')[0]
      );
      
      result.startingDateFormatted = CalendarUtil.formatNepaliDate(project.startingDate);
    }
    
    if (project.endingDate) {
      result.endingDateNepali = CalendarUtil.adToBs(
        typeof project.endingDate === 'string'
          ? project.endingDate
          : project.endingDate.toISOString().split('T')[0]
      );
      
      result.endingDateFormatted = CalendarUtil.formatNepaliDate(project.endingDate);
    }
    
    return result;
  }
}
