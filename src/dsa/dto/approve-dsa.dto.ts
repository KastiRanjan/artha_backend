import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ApproveDsaDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'Approved amount must be greater than 0' })
  approvedAmount: number;

  @IsOptional()
  @IsString()
  adminRemarks?: string;
}
