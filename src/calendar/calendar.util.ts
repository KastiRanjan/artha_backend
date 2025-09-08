import * as moment from 'moment';

// Nepali calendar data: days per month for years 2000-2090 BS
const nepaliMonthData = [
  // 2000 BS (1943-1944 AD)
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // Continue with data for each year through 2090 BS
  // This is a simplified example, in production you would include the full dataset
  // 2001 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2002 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // More years would be added here...
];

// Start date of Nepali calendar implementation (1943-04-14 in AD)
const startDateAD = moment('1943-04-14');
const startDateBS = { year: 2000, month: 1, day: 1 }; // 2000/01/01 BS

export class CalendarUtil {
  // Convert AD date (YYYY-MM-DD) to BS (YYYY-MM-DD)
  static adToBs(adDate: string): string {
    try {
      const adMoment = moment(adDate);
      
      // Calculate days difference from start date
      const daysDiff = adMoment.diff(startDateAD, 'days');
      
      if (daysDiff < 0) {
        throw new Error('Date is before the start of Nepali calendar support');
      }
      
      // Start with the base BS date
      let bsYear = startDateBS.year;
      let bsMonth = startDateBS.month;
      let bsDay = startDateBS.day;
      
      // Temporary counter for days to be allocated
      let daysRemaining = daysDiff;
      
      // Iterate through each year and month
      while (daysRemaining > 0) {
        // Get days in current BS month
        const daysInMonth = nepaliMonthData[bsYear - 2000][bsMonth - 1];
        
        // Days remaining in current month
        const daysLeftInMonth = daysInMonth - bsDay + 1;
        
        // If remaining days is greater than days left in month, move to next month
        if (daysRemaining >= daysLeftInMonth) {
          daysRemaining -= daysLeftInMonth;
          bsMonth++;
          bsDay = 1;
          
          // If month exceeds 12, move to next year
          if (bsMonth > 12) {
            bsYear++;
            bsMonth = 1;
            
            // Check if we have data for this year
            if (bsYear - 2000 >= nepaliMonthData.length) {
              throw new Error('Date is beyond the supported range of Nepali calendar');
            }
          }
        } else {
          // Otherwise, just add the days to the current date
          bsDay += daysRemaining;
          daysRemaining = 0;
        }
      }
      
      // Format BS date as YYYY-MM-DD
      return `${bsYear}-${bsMonth.toString().padStart(2, '0')}-${bsDay.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error converting AD to BS:', error);
      return adDate; // Return original date on error
    }
  }

  // Convert BS date (YYYY-MM-DD) to AD (YYYY-MM-DD)
  static bsToAd(bsDate: string): string {
    try {
      // Parse BS date
      const [yearStr, monthStr, dayStr] = bsDate.split('-');
      const bsYear = parseInt(yearStr);
      const bsMonth = parseInt(monthStr);
      const bsDay = parseInt(dayStr);
      
      // Validate BS date
      if (bsYear < 2000 || bsYear - 2000 >= nepaliMonthData.length) {
        throw new Error('BS year out of supported range');
      }
      
      if (bsMonth < 1 || bsMonth > 12) {
        throw new Error('Invalid BS month');
      }
      
      const daysInMonth = nepaliMonthData[bsYear - 2000][bsMonth - 1];
      if (bsDay < 1 || bsDay > daysInMonth) {
        throw new Error('Invalid BS day');
      }
      
      // Calculate days from the start date
      let totalDays = 0;
      
      // Add days from years before the target year
      for (let year = 2000; year < bsYear; year++) {
        for (let month = 0; month < 12; month++) {
          totalDays += nepaliMonthData[year - 2000][month];
        }
      }
      
      // Add days from months before the target month in the target year
      for (let month = 0; month < bsMonth - 1; month++) {
        totalDays += nepaliMonthData[bsYear - 2000][month];
      }
      
      // Add days in the target month
      totalDays += bsDay - 1;
      
      // Add to the start date to get the AD date
      const adDate = moment(startDateAD).add(totalDays, 'days');
      
      // Return in YYYY-MM-DD format
      return adDate.format('YYYY-MM-DD');
    } catch (error) {
      console.error('Error converting BS to AD:', error);
      return bsDate; // Return original date on error
    }
  }
  
  // Format date for display as Nepali date string
  static formatNepaliDate(adDate: string | Date): string {
    const bsDate = this.adToBs(typeof adDate === 'string' ? adDate : adDate.toISOString().split('T')[0]);
    const [year, month, day] = bsDate.split('-').map(part => parseInt(part));
    
    // Nepali month names
    const nepaliMonths = [
      'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
      'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
    ];
    
    // Return formatted date
    return `${day} ${nepaliMonths[month-1]} ${year}`;
  }
}
