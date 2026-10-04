/**
 * Precision financial math utility for Daily Subsistence Allowance (DSA).
 * Uses scaled integer arithmetic (cents) to eliminate JavaScript IEEE-754 floating point drift.
 */
export class DsaMath {
  /**
   * Convert monetary float/string into integer cents.
   */
  static toCents(amount: number | string): number {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }

  /**
   * Convert integer cents back to standard two-decimal number.
   */
  static fromCents(cents: number): number {
    return parseFloat((cents / 100).toFixed(2));
  }

  /**
   * Add two monetary values exactly.
   */
  static add(a: number | string, b: number | string): number {
    return this.fromCents(this.toCents(a) + this.toCents(b));
  }

  /**
   * Subtract b from a (a - b) exactly.
   */
  static subtract(a: number | string, b: number | string): number {
    return this.fromCents(this.toCents(a) - this.toCents(b));
  }

  /**
   * Sum an array of monetary values.
   */
  static sum(amounts: (number | string)[]): number {
    const totalCents = amounts.reduce<number>((acc, curr) => acc + this.toCents(curr), 0);
    return this.fromCents(totalCents);
  }

  /**
   * Multiply monetary amount by a scalar (e.g. rate or days).
   */
  static multiply(amount: number | string, factor: number): number {
    const cents = this.toCents(amount);
    return this.fromCents(Math.round(cents * factor));
  }

  /**
   * Format amount into standard currency display string.
   */
  static format(amount: number | string, currencySymbol: string = 'NRs.'): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `${currencySymbol} 0.00`;
    return `${currencySymbol} ${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
