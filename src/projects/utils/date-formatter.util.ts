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
    if (!project) return project;
    
    const result = { ...project };
    
    try {
      if (project.startingDate) {
        const startingDateStr = typeof project.startingDate === 'string'
          ? project.startingDate
          : project.startingDate.toISOString().split('T')[0];
        
        result.startingDateNepali = CalendarUtil.adToBs(startingDateStr);
        result.startingDateFormatted = CalendarUtil.formatNepaliDate(project.startingDate);
      }
    } catch (error) {
      console.error('Error formatting starting date:', error);
      // Leave fields undefined if conversion fails
    }
    
    try {
      if (project.endingDate) {
        const endingDateStr = typeof project.endingDate === 'string'
          ? project.endingDate
          : project.endingDate.toISOString().split('T')[0];
        
        result.endingDateNepali = CalendarUtil.adToBs(endingDateStr);
        result.endingDateFormatted = CalendarUtil.formatNepaliDate(project.endingDate);
      }
    } catch (error) {
      console.error('Error formatting ending date:', error);
      // Leave fields undefined if conversion fails
    }
    
    return result;
  }
}
