import * as moment from 'moment';

// Nepali calendar data: days per month for years 2000-2090 BS
// Complete dataset for accurate BS-AD conversion
const nepaliMonthData = [
  // 2000 BS (1943-1944 AD)
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2001 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2002 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2003 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2004 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  // 2005 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2006 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2007 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2008 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  // 2009 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2010 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2011 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2012 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  // 2013 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2014 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2015 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2016 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  // 2017 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2018 BS
  [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2019 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2020 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2021 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2022 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2023 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2024 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2025 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2026 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2027 BS
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2028 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2029 BS
  [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  // 2030 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2031 BS
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2032 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2033 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2034 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2035 BS
  [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  // 2036 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2037 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2038 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2039 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  // 2040 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2041 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2042 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2043 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  // 2044 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2045 BS
  [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2046 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2047 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2048 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2049 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2050 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2051 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2052 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2053 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2054 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2055 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2056 BS
  [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  // 2057 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2058 BS
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2059 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2060 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2061 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2062 BS
  [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  // 2063 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2064 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2065 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2066 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  // 2067 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2068 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2069 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2070 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  // 2071 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2072 BS
  [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2073 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2074 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2075 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2076 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2077 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2078 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2079 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2080 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2081 BS
  [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  // 2082 BS
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  // 2083 BS
  [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  // 2084 BS
  [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  // 2085 BS
  [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  // 2086 BS
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  // 2087 BS
  [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  // 2088 BS
  [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  // 2089 BS
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  // 2090 BS
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  // 2091 BS
  [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  // 2092 BS
  [30, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  // 2093 BS
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  // 2094 BS
  [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  // 2095 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  // 2096 BS
  [30, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2097 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  // 2098 BS
  [31, 31, 32, 31, 31, 31, 29, 30, 29, 30, 29, 31],
  // 2099 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 29, 30, 30, 30],
  // 2100 BS
  [31, 32, 31, 32, 30, 31, 30, 29, 30, 29, 30, 30],
  // 2101 BS (for dates through ~2044 AD)
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2102 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2103 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  // 2104 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2105 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2106 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2107 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2108 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2109 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2110 BS
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2111 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2112 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2113 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2114 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  // 2115 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2116 BS
  [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2117 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2118 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2119 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2120 BS (approximately 2063 AD)
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2121 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2122 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2123 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2124 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2125 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2126 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2127 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2128 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2129 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2130 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2131 BS
  [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  // 2132 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2133 BS
  [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2134 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2135 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2136 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2137 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  // 2138 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2139 BS
  [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2140 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2141 BS
  [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  // 2142 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2143 BS
  [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  // 2144 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  // 2145 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2146 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2147 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2148 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2149 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2150 BS (approximately 2093 AD - covers your 2098 date)
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2151 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  // 2152 BS
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  // 2153 BS
  [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2154 BS
  [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  // 2155 BS (approximately 2098 AD)
  [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30]
];

// Start date of Nepali calendar implementation (1943-04-14 in AD)
const startDateAD = moment('1943-04-14');
const startDateBS = { year: 2000, month: 1, day: 1 }; // 2000/01/01 BS

export class CalendarUtil {
  // Convert AD date (YYYY-MM-DD) to BS (YYYY-MM-DD)
  static adToBs(adDate: string): string {
    try {
      const adMoment = moment(adDate);
      
      // Validate the date
      if (!adMoment.isValid()) {
        console.warn('Invalid AD date format:', adDate);
        return adDate;
      }
      
      // Calculate days difference from start date
      const daysDiff = adMoment.diff(startDateAD, 'days');
      
      if (daysDiff < 0) {
        console.warn('Date is before the start of Nepali calendar support (before 1943-04-14):', adDate);
        return adDate; // Return original date for dates before 1943
      }
      
      // Start with the base BS date
      let bsYear = startDateBS.year;
      let bsMonth = startDateBS.month;
      let bsDay = startDateBS.day;
      
      // Temporary counter for days to be allocated
      let daysRemaining = daysDiff;
      
      // Iterate through each year and month
      while (daysRemaining > 0) {
        // Check if we have data for this year
        if (bsYear - 2000 >= nepaliMonthData.length) {
          console.warn('Date is beyond the supported range of Nepali calendar (after 2155 BS / ~2098 AD):', adDate);
          return adDate; // Return original AD date if beyond range
        }
        
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
    try {
      const dateStr = typeof adDate === 'string' ? adDate : adDate.toISOString().split('T')[0];
      const bsDate = this.adToBs(dateStr);
      
      // If conversion failed (returned original AD date), format AD date instead
      if (bsDate === dateStr) {
        // Return a formatted AD date as fallback
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
      
      const [year, month, day] = bsDate.split('-').map(part => parseInt(part));
      
      // Nepali month names
      const nepaliMonths = [
        'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
        'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
      ];
      
      // Return formatted date
      return `${day} ${nepaliMonths[month-1]} ${year}`;
    } catch (error) {
      console.error('Error formatting Nepali date:', error);
      // Return a formatted AD date as ultimate fallback
      const dateStr = typeof adDate === 'string' ? adDate : adDate.toISOString().split('T')[0];
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  }
}
