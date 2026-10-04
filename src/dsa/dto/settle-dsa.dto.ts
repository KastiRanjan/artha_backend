import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SettleDsaDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Settlement amount must be greater than 0' })
  settlementAmount: number;

  @IsNotEmpty()
  @IsString()
  billDetails: string;

  @IsOptional()
  @IsString()
  billImage?: string;

  /**
   * JSON stringified array of itemized expenses:
   * Array<{ category: string; expenseDate: string; amount: number; receiptNumber?: string; remarks?: string }>
   */
  @IsOptional()
  @IsString()
  expenseItems?: string;
}
